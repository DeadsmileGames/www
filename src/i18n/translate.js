import messages from "./messages.json" with { type: "json" };
import errors from "../generated/errors.json" with { type: "json" };

const knownSourceKeys = new Set();
const localizedValues = new Map();
const valueSources = new Map();
const templates = [];

for (const [locale, catalog] of Object.entries(messages)) {
  const values = new Set(Object.values(catalog));
  localizedValues.set(locale, values);

  for (const [source, value] of Object.entries(catalog)) {
    knownSourceKeys.add(source);
    if (!valueSources.has(value)) valueSources.set(value, new Set());
    valueSources.get(value).add(source);

    for (const text of new Set([source, value])) {
      const names = [];
      const pattern = text
        .split(/(\{\w+\})/g)
        .map((part) => {
          if (/^\{\w+\}$/.test(part)) {
            names.push(part.slice(1, -1));
            return "(.*?)";
          }
          return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("");
      if (names.length)
        templates.push({ source, names, pattern: new RegExp(`^${pattern}$`, "u") });
    }
  }
}

const errorCodes = new Map();
for (const catalog of Object.values(errors)) {
  for (const [code, message] of Object.entries(catalog)) {
    errorCodes.set(message, code);
  }
}

function canonicalSource(source) {
  const seen = new Set();
  const english = messages.en || {};

  while (
    Object.hasOwn(english, source) &&
    typeof english[source] === "string" &&
    english[source] !== source &&
    !seen.has(source)
  ) {
    seen.add(source);
    source = english[source];
  }

  return source;
}

function resolveReverseSource(value, locale) {
  const candidates = valueSources.get(value);
  if (!candidates?.size) return null;

  const catalog = messages[locale] || {};
  const targetValues = new Set(
    [...candidates].map((source) => catalog[source] ?? source),
  );

  // Do not canonicalize aliases until we have verified that every candidate
  // has the same translation in the destination locale. For example, "Retry"
  // and "Try again" are close in meaning but have distinct Spanish labels.
  if (targetValues.size !== 1) return null;

  const targetValue = targetValues.values().next().value;
  for (const source of new Set([...candidates].map(canonicalSource))) {
    if ((catalog[source] ?? source) === targetValue) return source;
  }
  return candidates.values().next().value ?? null;
}

function withOriginalWhitespace(value, text) {
  return (
    value.slice(0, value.length - value.trimStart().length) +
    text +
    value.slice(value.trimEnd().length)
  );
}

export function translate(value, language = "en", variables = {}) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  const locale = ["en", "es", "pt-BR"].includes(language) ? language : "en";
  const catalog = messages[locale] || {};
  const errorCode = errorCodes.get(value) || errorCodes.get(trimmed);
  const exactSourceKey = knownSourceKeys.has(value);
  const exactLocaleKey = Object.hasOwn(catalog, value);
  const key = exactSourceKey ? value : trimmed;

  if (errorCode) {
    const text = errors[locale]?.[errorCode] ?? errors.en[errorCode] ?? key;
    const formatted = text.replace(/\{(\w+)\}/g, (match, name) =>
      Object.hasOwn(variables, name) ? String(variables[name]) : match,
    );
    return exactSourceKey ? formatted : withOriginalWhitespace(value, formatted);
  }

  let source;
  if (Object.hasOwn(catalog, key)) {
    source = key;
  } else if (exactSourceKey) {
    // Known source key, intentionally absent from this locale's catalogue.
    // Preserve the source text exactly instead of reverse-matching a fragment.
    source = key;
  } else if (localizedValues.get(locale)?.has(key)) {
    // The value is already translated for the active locale. Treat t(t(x)) as
    // idempotent instead of reverse-mapping a duplicate phrase to another key.
    return value;
  } else {
    source = resolveReverseSource(key, locale) || key;
  }

  let values = variables;
  if (
    source === key &&
    !exactSourceKey &&
    !Object.hasOwn(catalog, key)
  ) {
    for (const template of templates) {
      const match = key.match(template.pattern);
      if (!match) continue;
      source = template.source;
      values = {
        ...Object.fromEntries(
          template.names.map((name, index) => [name, match[index + 1]]),
        ),
        ...variables,
      };
      break;
    }
  }

  const text = catalog[source] ?? source;
  const formatted = text.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );

  // Keys containing intentional leading/trailing spaces are used for inline
  // fragments. Their translations already contain the spacing, so don't add
  // the original spaces a second time.
  return exactSourceKey || exactLocaleKey
    ? formatted
    : withOriginalWhitespace(value, formatted);
}
