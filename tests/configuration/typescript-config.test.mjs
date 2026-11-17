import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../../", import.meta.url));

function compileFixture(profile, sources, shouldEmit = false) {
  // Keep compiler fixtures outside application source and retain them for diagnosis.
  const fixtures = join(root, ".task-checks");
  mkdirSync(fixtures, { recursive: true });
  const directory = mkdtempSync(join(fixtures, "typescript-"));
  const files = Object.entries(sources).map(([name, content]) => {
    const path = join(directory, name);
    writeFileSync(path, content);
    return path;
  });
  const configPath = join(root, profile);
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(
    { ...config.config, files },
    ts.sys,
    root,
    {
      noEmit: !shouldEmit,
      rootDir: directory,
      outDir: join(directory, "dist"),
    },
    configPath,
  );
  assert.deepEqual(parsed.errors, []);
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (shouldEmit && diagnostics.length === 0) {
    diagnostics.push(...program.emit().diagnostics);
  }
  return { directory, diagnostics };
}

function assertCompiles(diagnostics) {
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    }),
  );
}

test("Node profile emits runnable ESM with relative .js imports", async () => {
  const { directory, diagnostics } = compileFixture(
    "tsconfig.node.json",
    {
      "value.ts": 'export const stage = "foundation";\n',
      "entry.ts":
        'import { stage } from "./value.js";\n' +
        'import { basename } from "node:path";\n' +
        'export const result = basename("/setup/" + stage);\n',
    },
    true,
  );
  assertCompiles(diagnostics);
  const module = await import(
    pathToFileURL(join(directory, "dist", "entry.js")).href
  );
  assert.equal(module.result, "foundation");
});

test("strict settings reject implicit any, absent-option misuse and unchecked entries", () => {
  const { diagnostics } = compileFixture("tsconfig.node.json", {
    "invalid.ts":
      "export function identity(value) { return value; }\n" +
      "interface Request { readonly caption?: string; }\n" +
      "export const request: Request = { caption: undefined };\n" +
      "const ids: string[] = [];\n" +
      "export const first = ids[0].toUpperCase();\n",
  });
  const codes = new Set(diagnostics.map((diagnostic) => diagnostic.code));
  assert.ok(codes.has(7006), "Implicit any must be rejected");
  assert.ok(
    codes.has(2375),
    "Explicit undefined must violate the optional field",
  );
  assert.ok(codes.has(2532), "Unchecked array access must be rejected");
});

test("Node profile rejects extensionless ESM imports and browser globals", () => {
  const { diagnostics } = compileFixture("tsconfig.node.json", {
    "value.ts": 'export const stage = "foundation";\n',
    "invalid.ts":
      'import { stage } from "./value";\n' +
      "export const title = document.title + stage;\n",
  });
  const codes = new Set(diagnostics.map((diagnostic) => diagnostic.code));
  assert.ok(codes.has(2835), "Node ESM imports must use explicit extensions");
  assert.ok(codes.has(2584), "Backend must not inherit DOM globals");
});

test("web profile supports React JSX, browser APIs and bundler imports", () => {
  const { diagnostics } = compileFixture("tsconfig.web.json", {
    "value.ts": 'export const stage = "foundation";\n',
    "page.tsx":
      'import type { ReactElement } from "react";\n' +
      'import { stage } from "./value";\n' +
      "export function Page(): ReactElement {\n" +
      "  return <main>{stage + document.title}</main>;\n" +
      "}\n",
  });
  assertCompiles(diagnostics);
});
