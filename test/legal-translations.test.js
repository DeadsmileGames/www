import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import messages from "../src/i18n/messages.json" with { type: "json" };

const localizedComponents = [
  "../src/pages/Privacy.jsx",
  "../src/pages/Terms.jsx",
  "../src/pages/Cookies.jsx",
  "../src/pages/Accessibility.jsx",
  "../src/components/layout/Footer.jsx",
  "../src/components/ui/CookieConsent.jsx",
  "../src/pages/Preorder.jsx",
  "../src/pages/PressKit.jsx",
  "../src/pages/Support.jsx",
  "../src/pages/Account.jsx",
  "../src/pages/Soundtracks.jsx",
  "../src/components/videos/VideoOverlay.jsx",
  "../src/components/videos/LiveChatPanel.jsx",
  "../src/components/videos/PremiereBanner.jsx",
  "../src/components/games/FeaturedHero.jsx",
  "../src/components/admin/AdminComposer.jsx",
];

test("legal, consent and accessibility copy is translated in Portuguese and Spanish", async () => {
  const missing = [];

  for (const componentPath of localizedComponents) {
    const source = await readFile(new URL(componentPath, import.meta.url), "utf8");
    const literals = new Set();

    for (const match of source.matchAll(/\bt\(\s*("(?:\\.|[^"\\])*")/g)) {
      const literal = JSON.parse(match[1]);
      if (/^(auth|nav|hero|common|games|account|studio|news|support|downloads|media|footer)\./.test(literal)) continue;
      literals.add(literal);
    }

    for (const literal of literals) {
      for (const locale of ["pt-BR", "es"]) {
        if (!Object.hasOwn(messages[locale] || {}, literal)) {
          missing.push({ componentPath, locale, literal });
        }
      }
    }
  }

  assert.deepEqual(missing, []);
});
