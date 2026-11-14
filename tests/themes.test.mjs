import test from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { loadTypeScript } from "./support/load-typescript.mjs";

const {
  themes,
  defaultTheme,
  themeStorageKey,
  themeBootstrapScript,
  getThemeSnapshot,
  getServerThemeSnapshot,
  setTheme,
  restoreTheme,
  subscribeToTheme,
} = await loadTypeScript(new URL("../src/lib/themes.ts", import.meta.url));

function bootstrap(value, blocked = false) {
  const document = { documentElement: { dataset: { theme: defaultTheme } } };
  runInNewContext(themeBootstrapScript, {
    document,
    localStorage: {
      getItem() {
        if (blocked) throw new Error("Storage blocked");
        return value;
      },
    },
  });
  return document.documentElement.dataset.theme;
}

function browser(initialTheme = defaultTheme, blocked = false) {
  const values = new Map();
  const window = new EventTarget();
  window.localStorage = {
    getItem(key) {
      if (blocked) throw new Error("Storage blocked");
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (blocked) throw new Error("Storage blocked");
      values.set(key, value);
    },
  };
  const previous = { window: globalThis.window, document: globalThis.document };
  globalThis.window = window;
  globalThis.document = { documentElement: { dataset: { theme: initialTheme } } };
  return {
    values,
    window,
    cleanup() {
      if (previous.window === undefined) delete globalThis.window;
      else globalThis.window = previous.window;
      if (previous.document === undefined) delete globalThis.document;
      else globalThis.document = previous.document;
    },
  };
}

test("the pre-paint script restores every supported theme", () => {
  for (const theme of themes) assert.equal(bootstrap(theme.id), theme.id);
});

test("invalid or hostile stored values leave the default theme intact", () => {
  for (const value of [
    null,
    "",
    "unknown",
    "<script>alert(1)</script>",
    "ivory; document.cookie",
  ]) {
    assert.equal(bootstrap(value), defaultTheme);
  }
});

test("blocked browser storage does not break the pre-paint script", () => {
  assert.equal(bootstrap("nebula", true), defaultTheme);
});

test("a selection updates the document, persists and notifies subscribers", () => {
  const env = browser();
  let changes = 0;
  const unsubscribe = subscribeToTheme(() => {
    changes += 1;
  });
  try {
    setTheme("orbit");
    assert.equal(getThemeSnapshot(), "orbit");
    assert.equal(env.values.get(themeStorageKey), "orbit");
    assert.equal(changes, 1);
    unsubscribe();
    setTheme("glacier");
    assert.equal(changes, 1, "unmounted components must not retain listeners");
  } finally {
    unsubscribe();
    env.cleanup();
  }
});

test("theme selection still works when saving preferences is blocked", () => {
  const env = browser(defaultTheme, true);
  try {
    assert.doesNotThrow(() => setTheme("aurora"));
    assert.equal(getThemeSnapshot(), "aurora");
  } finally {
    env.cleanup();
  }
});

test("development remounts restore the saved theme without a full page reload", () => {
  const env = browser();
  try {
    env.values.set(themeStorageKey, "nebula");
    restoreTheme();
    assert.equal(getThemeSnapshot(), "nebula");
  } finally {
    env.cleanup();
  }
});

test("other tabs synchronize preferences and reset to default after removal", () => {
  const env = browser();
  const unsubscribe = subscribeToTheme(() => {});
  try {
    env.values.set(themeStorageKey, "dusk");
    env.window.dispatchEvent(Object.assign(new Event("storage"), { key: "unrelated" }));
    assert.equal(getThemeSnapshot(), defaultTheme);
    env.window.dispatchEvent(Object.assign(new Event("storage"), { key: themeStorageKey }));
    assert.equal(getThemeSnapshot(), "dusk");
    env.values.delete(themeStorageKey);
    env.window.dispatchEvent(Object.assign(new Event("storage"), { key: null }));
    assert.equal(getThemeSnapshot(), defaultTheme);
  } finally {
    unsubscribe();
    env.cleanup();
  }
});

test("server rendering always uses the same deterministic hydration snapshot", () => {
  const env = browser("orbit");
  try {
    assert.equal(getServerThemeSnapshot(), defaultTheme);
    assert.equal(getThemeSnapshot(), "orbit");
  } finally {
    env.cleanup();
  }
});
