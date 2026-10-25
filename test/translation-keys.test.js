import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import messages from "../src/i18n/messages.json" with { type: "json" };
import { translate } from "../src/i18n/translate.js";

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const languagePath = /^(auth|nav|hero|common|games|account|studio|news|support|downloads|media|footer)\.[A-Za-z][\w]*$/;

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(fullPath)));
    } else if (entry.isFile() && /\.(?:js|jsx|mjs|ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function decodeStringLiteral(raw) {
  const quote = raw[0];
  if (quote === "\`" && raw.includes("\${")) return null;
  if (quote === '"') {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  const value = raw.slice(1, -1);
  let decoded = "";

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character !== "\\") {
      decoded += character;
      continue;
    }

    const escaped = value[++index];
    if (escaped === undefined) return null;
    if (escaped === "\n") continue;
    if (escaped === "\r") {
      if (value[index + 1] === "\n") index += 1;
      continue;
    }

    const simpleEscapes = {
      "0": "\0",
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "\t",
      v: "\v",
    };
    if (Object.hasOwn(simpleEscapes, escaped)) {
      decoded += simpleEscapes[escaped];
      continue;
    }

    if (escaped === "x" && /^[0-9a-fA-F]{2}$/.test(value.slice(index + 1, index + 3))) {
      decoded += String.fromCharCode(Number.parseInt(value.slice(index + 1, index + 3), 16));
      index += 2;
      continue;
    }

    if (escaped === "u") {
      if (value[index + 1] === "{") {
        const end = value.indexOf("}", index + 2);
        const digits = end < 0 ? "" : value.slice(index + 2, end);
        if (!/^[0-9a-fA-F]{1,6}$/.test(digits)) return null;
        const codePoint = Number.parseInt(digits, 16);
        if (codePoint > 0x10ffff) return null;
        decoded += String.fromCodePoint(codePoint);
        index = end;
        continue;
      }
      const digits = value.slice(index + 1, index + 5);
      if (!/^[0-9a-fA-F]{4}$/.test(digits)) return null;
      decoded += String.fromCharCode(Number.parseInt(digits, 16));
      index += 4;
      continue;
    }

    decoded += escaped;
  }

  return decoded;
}

test("all static translation keys used by the website exist in PT-BR and Spanish", async () => {
  const missing = [];
  const catalogs = Object.values(messages);
  const files = await listSourceFiles(sourceRoot);

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const pattern = /\bt\(\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g;

    for (const match of source.matchAll(pattern)) {
      const literal = decodeStringLiteral(match[1]);
      if (literal === null || languagePath.test(literal)) continue;

      const key = catalogs.some((catalog) => Object.hasOwn(catalog, literal))
        ? literal
        : literal.trim();
      const line = source.slice(0, match.index).split("\n").length;
      const relativePath = filePath.slice(sourceRoot.length);

      for (const locale of ["pt-BR", "es"]) {
        if (!Object.hasOwn(messages[locale] || {}, key)) {
          missing.push({ locale, key, location: `${relativePath}:${line}` });
        }
      }
    }
  }

  assert.deepEqual(missing, []);
});

test("all legacy LanguageContext copy is translated except proper brand names", async () => {
  const source = await readFile(new URL("../src/context/LanguageContext.jsx", import.meta.url), "utf8");
  const start = source.indexOf("const strings = {");
  const end = source.indexOf("\n};", start);
  assert.notEqual(start, -1, "LanguageContext strings object must exist");
  assert.notEqual(end, -1, "LanguageContext strings object must be closed");

  const literals = new Set();
  const block = source.slice(start, end + 3);
  const pattern = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
  for (const match of block.matchAll(pattern)) {
    const literal = decodeStringLiteral(match[0]);
    if (literal !== null) literals.add(literal);
  }

  const branded = new Set(["Deadsmile Games", "Deadsmile Games Launcher"]);
  const missing = [];
  for (const literal of literals) {
    if (branded.has(literal)) continue;
    for (const locale of ["pt-BR", "es"]) {
      if (!Object.hasOwn(messages[locale] || {}, literal)) {
        missing.push({ locale, literal });
      }
    }
  }

  assert.deepEqual(missing, []);
});

test("every English source key has PT-BR and Spanish mappings", () => {
  const missing = Object.keys(messages.en).filter(
    (key) =>
      !Object.hasOwn(messages["pt-BR"], key) ||
      !Object.hasOwn(messages.es, key),
  );
  assert.deepEqual(missing, []);
});

test("direct source keys resolve to the matching locale entry", () => {
  for (const locale of ["en", "pt-BR", "es"]) {
    for (const [key, expected] of Object.entries(messages[locale])) {
      assert.equal(
        translate(key, locale),
        expected,
        `Unexpected direct translation for ${locale}: ${JSON.stringify(key)}`,
      );
    }
  }
});

test("translated inline fragments preserve their intended spaces", () => {
  assert.equal(
    translate("All assets are provided for ", "pt-BR"),
    "Todos os recursos são fornecidos para ",
  );
  assert.equal(translate(" purposes only.", "pt-BR"), " apenas.");
  assert.equal(translate("Always credit ", "es"), "Acredita siempre a ");
  assert.equal(
    translate(" when using these assets.", "pt-BR"),
    " ao usar esses recursos.",
  );
  assert.equal(
    translate("A confirmation link has been sent to ", "pt-BR"),
    "Um link de confirmação foi enviado para ",
  );
  assert.equal(
    translate(". Your current email address will remain ", "es"),
    ". Tu dirección de correo actual seguirá ",
  );
});

test("ambiguous translated values are not guessed into a different source label", () => {
  assert.equal(translate("Tentar novamente", "es"), "Tentar novamente");
  assert.equal(translate("Vista general", "pt-BR"), "Visão geral");
  assert.equal(translate("Resumen", "pt-BR"), "Resumo");
  assert.equal(translate("Cerrar sesión", "pt-BR"), "Cerrar sesión");
});

test("the admin Overview label uses the correct localized meaning", () => {
  assert.equal(translate("Overview", "pt-BR"), "Visão geral");
  assert.equal(translate("Overview", "es"), "Vista general");
});
