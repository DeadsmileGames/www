import { useEffect, useState } from "react";
import { getExternalPageTitle, normalizeWebLink } from "../../utils/linkTitles";

const URL_EXPRESSION = /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
const MAX_LOOKUPS_PER_TEXT = 8;

function splitText(value) {
  const parts = [];
  const links = [];
  let cursor = 0;
  let match;
  URL_EXPRESSION.lastIndex = 0;

  while ((match = URL_EXPRESSION.exec(value))) {
    let raw = match[0];
    let trailing = "";
    while (/[.,!?;:)\]]$/.test(raw)) {
      trailing = raw.slice(-1) + trailing;
      raw = raw.slice(0, -1);
    }
    const parsed = normalizeWebLink(raw);
    if (!raw || !parsed) continue;

    if (match.index > cursor) {
      parts.push({ type: "text", value: value.slice(cursor, match.index) });
    }
    const href = parsed.href;
    const link = { type: "link", raw, href };
    parts.push(link);
    links.push(link);
    if (trailing) parts.push({ type: "text", value: trailing });
    cursor = match.index + match[0].length;
  }

  if (cursor < value.length) parts.push({ type: "text", value: value.slice(cursor) });
  return { parts, links };
}

export function AutoLinkText({ children, as: Tag = "span", ...props }) {
  const value = typeof children === "string" ? children : String(children ?? "");
  const { parts, links } = splitText(value);
  const linkKey = links
    .slice(0, MAX_LOOKUPS_PER_TEXT)
    .map((link) => link.href)
    .join("\n");
  const [titles, setTitles] = useState({});

  useEffect(() => {
    let active = true;
    const candidates = links.slice(0, MAX_LOOKUPS_PER_TEXT);
    for (const link of candidates) {
      getExternalPageTitle(link.href).then((title) => {
        if (!active || !title) return;
        setTitles((current) =>
          current[link.href] === title ? current : { ...current, [link.href]: title },
        );
      });
    }
    return () => {
      active = false;
    };
  }, [linkKey]);

  if (parts.length === 1 && parts[0]?.type === "text") {
    return <Tag {...props}>{value}</Tag>;
  }

  return (
    <Tag {...props}>
      {parts.map((part, index) =>
        part.type === "text" ? (
          <span key={`text-${index}`}>{part.value}</span>
        ) : (
          <a
            key={part.href + "-" + index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {titles[part.href] || part.raw}
          </a>
        ),
      )}
    </Tag>
  );
}
