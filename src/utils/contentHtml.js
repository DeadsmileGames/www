import createDOMPurify from "dompurify";
import {
  newswireTags,
  newswireAttributes,
  microsoftBadgeLink,
  microsoftBadgeImage,
} from "../generated/contentPolicy";

const purifier = createDOMPurify(window);
purifier.addHook("uponSanitizeElement", (node) => {
  if (node.nodeName.toLowerCase() !== "img") return;
  const parent = node.parentElement;
  const src = microsoftBadgeImage(node.getAttribute("src"));
  if (
    parent?.nodeName.toLowerCase() !== "a" ||
    !microsoftBadgeLink(parent.getAttribute("href")) ||
    !src
  ) {
    node.remove();
    return;
  }
  node.setAttribute("src", src);
  node.setAttribute("width", "200");
  node.setAttribute("alt", "Get it from Microsoft Store");
  node.setAttribute("loading", "lazy");
});
purifier.addHook("afterSanitizeAttributes", (node) => {
  const tag = node.nodeName.toLowerCase();
  const attributes = newswireAttributes[tag] || [];
  for (const attribute of Array.from(node.attributes || [])) {
    if (!attributes.includes(attribute.name)) node.removeAttribute(attribute.name);
  }
  if (tag !== "a") return;
  const href = microsoftBadgeLink(node.getAttribute("href"));
  if (href) {
    node.setAttribute("href", href);
    node.setAttribute("target", "_self");
    node.setAttribute("aria-label", "Get it from Microsoft Store");
  } else {
    const value = node.getAttribute("href") || "";
    if (!/^(?:https?:\/\/|mailto:)/i.test(value) || /[\u0000-\u0020\\]/.test(value))
      node.removeAttribute("href");
    node.setAttribute("target", "_blank");
    node.removeAttribute("aria-label");
  }
  node.setAttribute("rel", "noopener noreferrer");
});

function linkifyPlainUrls(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const candidates = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest("a, code, pre")) continue;
    if (/(?:https?:\/\/|www\.)[^\s<>"'\x60]+/i.test(node.nodeValue || "")) {
      candidates.push(node);
    }
  }

  const expression = /(?:https?:\/\/|www\.)[^\s<>"'\x60]+/gi;
  for (const textNode of candidates) {
    const value = textNode.nodeValue || "";
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let match;
    expression.lastIndex = 0;

    while ((match = expression.exec(value))) {
      let displayUrl = match[0];
      let trailing = "";
      while (/[.,!?;:)\]]$/.test(displayUrl)) {
        trailing = displayUrl.slice(-1) + trailing;
        displayUrl = displayUrl.slice(0, -1);
      }
      if (!displayUrl) continue;

      fragment.append(document.createTextNode(value.slice(cursor, match.index)));
      const href = /^www\./i.test(displayUrl) ? "https://" + displayUrl : displayUrl;
      let validUrl;
      try {
        validUrl = new URL(href);
      } catch {
        validUrl = null;
      }
      if (!validUrl || !["https:", "http:"].includes(validUrl.protocol)) {
        fragment.append(document.createTextNode(match[0]));
      } else {
        const anchor = document.createElement("a");
        anchor.href = validUrl.href;
        anchor.textContent = displayUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        fragment.append(anchor);
        if (trailing) fragment.append(document.createTextNode(trailing));
      }
      cursor = match.index + match[0].length;
    }

    fragment.append(document.createTextNode(value.slice(cursor)));
    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}

export function sanitizeNewswire(
  value,
  language = document.documentElement.lang || "en",
) {
  const clean = purifier.sanitize(String(value || ""), {
    ALLOWED_TAGS: newswireTags,
    ALLOWED_ATTR: [...new Set(Object.values(newswireAttributes).flat())],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
  const template = document.createElement("template");
  template.innerHTML = clean;
  linkifyPlainUrls(template.content);
  if (language) {
    for (const image of template.content.querySelectorAll("img")) {
      const src = microsoftBadgeImage(image.getAttribute("src"), language);
      if (src) image.setAttribute("src", src);
    }
  }
  return template.innerHTML;
}
