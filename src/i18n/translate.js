import messages from "./messages.json" with { type: "json" };
import errors from "../generated/errors.json" with { type: "json" };

const sources = new Map();
const templates = [];
for (const catalog of Object.values(messages)) {
  for (const [source, value] of Object.entries(catalog)) {
    if (!sources.has(value)) sources.set(value, source);
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
  for (const [code, message] of Object.entries(catalog)) errorCodes.set(message, code);
}

export function translate(value, language = "en", variables = {}) {
  if (typeof value !== "string") return value;
  const key = value.trim();
  const locale = ["ar", "zh-CN", "en", "fr", "de", "hi", "ja", "ko", "pt-BR", "ru", "es"].includes(language) ? language : "en";
  const code = errorCodes.get(key);
  let source = Object.hasOwn(messages[locale] || {}, key) ? key : sources.get(key) || key;
  let values = variables;
  if (!code && source === key && !Object.hasOwn(messages["pt-BR"], key)) {
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
  const text = code ? (errors[locale]?.[code] ?? errors.en[code] ?? key) : (messages[locale]?.[source] ?? source);
  const formatted = text.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
  return (
    value.slice(0, value.length - value.trimStart().length) +
    formatted +
    value.slice(value.trimEnd().length)
  );
}
