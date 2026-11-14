import { readFile } from "node:fs/promises";
import ts from "typescript";

// Test pure production modules with the project's own TypeScript compiler.
export async function loadTypeScript(url) {
  const source = await readFile(url, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
