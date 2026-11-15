import { readFile } from "node:fs/promises";
import ts from "typescript";

const modules = new Map();

// Test pure production modules, including their shared local data dependencies.
async function moduleUrl(url) {
  if (!modules.has(url.href)) {
    modules.set(
      url.href,
      (async () => {
        const source = await readFile(url, "utf8");
        let output = url.pathname.endsWith(".json")
          ? `export default ${JSON.stringify(JSON.parse(source))};`
          : ts.transpileModule(source, {
              compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 },
            }).outputText;
        const imports = [...output.matchAll(/\bfrom\s+["']([^"']+)["']/g)];
        for (const match of imports.reverse()) {
          const specifier = match[1];
          if (!specifier.startsWith(".") && !specifier.startsWith("@/")) continue;
          const dependency = specifier.startsWith("@/")
            ? new URL(`../../src/${specifier.slice(2)}`, import.meta.url)
            : new URL(specifier, url);
          if (!/\.(ts|json)$/.test(dependency.pathname)) dependency.pathname += ".ts";
          const replacement = await moduleUrl(dependency);
          const start = match.index + match[0].indexOf(specifier);
          output = output.slice(0, start) + replacement + output.slice(start + specifier.length);
        }
        return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
      })(),
    );
  }
  return modules.get(url.href);
}

export async function loadTypeScript(url) {
  return import(await moduleUrl(url));
}
