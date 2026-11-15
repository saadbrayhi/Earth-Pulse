// Isolated headless Chrome QA when no managed Browser connection is available.
// Uses a fresh temporary profile; never reads the user's browser profile or sessions.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function withTestBrowser(run) {
  const folder = await mkdtemp(join(tmpdir(), "earthpulse-browser-"));
  const chrome = spawn(
    process.env.CHROME_BIN ?? "/opt/google/chrome/chrome",
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--disable-default-apps",
      "--no-default-browser-check",
      "--remote-debugging-port=0",
      `--user-data-dir=${folder}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  let socket;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Chrome startup timed out")), 15000);
      chrome.once("error", reject);
      chrome.once("exit", (code) => reject(new Error(`Chrome exited ${code}`)));
      chrome.stderr.on("data", (chunk) => {
        const match = chunk.toString().match(/DevTools listening on (ws:\/\/\S+)/);
        if (match) {
          clearTimeout(timer);
          resolve(match[1]);
        }
      });
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    let sequence = 0,
      session;
    const pending = new Map(),
      errors = [];
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const job = pending.get(message.id);
        if (job) {
          clearTimeout(job.timer);
          pending.delete(message.id);
          if (message.error) job.reject(new Error(JSON.stringify(message.error)));
          else job.resolve(message.result);
        }
      }
      if (message.method === "Fetch.requestPaused") {
        void send("Fetch.fulfillRequest", {
          requestId: message.params.requestId,
          responseCode: 503,
          responseHeaders: [{ name: "Content-Type", value: "application/json" }],
          body: Buffer.from('{"error":"controlled QA failure"}').toString("base64"),
        }).catch((error) => errors.push(error.message));
      }
      if (message.method === "Runtime.exceptionThrown")
        errors.push(
          message.params.exceptionDetails.text +
            ": " +
            (message.params.exceptionDetails.exception?.description ?? ""),
        );
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error")
        errors.push(message.params.args.map((a) => a.value ?? a.description).join(" "));
    });
    function send(method, params = {}, withSession = true) {
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }, 15000);
        pending.set(id, { resolve, reject, timer });
        socket.send(
          JSON.stringify({
            id,
            method,
            params,
            ...(withSession && session ? { sessionId: session } : {}),
          }),
        );
      });
    }
    const target = await send("Target.createTarget", { url: "about:blank" }, false);
    session = (
      await send("Target.attachToTarget", { targetId: target.targetId, flatten: true }, false)
    ).sessionId;
    await send("Runtime.enable");
    await send("Page.enable");
    async function evaluate(expression) {
      const r = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (r.exceptionDetails)
        throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    }
    async function until(expression) {
      const end = Date.now() + 20000;
      while (Date.now() < end) {
        if (await evaluate(expression)) return;
        await new Promise((r) => setTimeout(r, 100));
      }
      throw new Error("Timed out: " + expression);
    }
    async function click(text) {
      assert.ok(
        await evaluate(
          `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)return false;b.click();return true;})()`,
        ),
        `Button missing: ${text}`,
      );
    }
    async function screenshot(name) {
      const result = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      await writeFile(join(folder, name + ".png"), Buffer.from(result.data, "base64"));
    }
    await run({ send, evaluate, until, click, screenshot, errors, folder });
  } finally {
    socket?.close();
    chrome.kill("SIGTERM");
  }
}
