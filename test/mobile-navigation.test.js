import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("mobile navigation exposes its control relationship and current route", async () => {
  const [header, menu, styles] = await Promise.all([
    readFile(new URL("../src/components/layout/Header.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/navigation/MobileMenu.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/global.css", import.meta.url), "utf8"),
  ]);

  assert.ok(header.includes('aria-label={t("Open menu")}'));
  assert.ok(header.includes('aria-controls="mobile-navigation"'));
  assert.ok(header.includes("aria-expanded={mobileOpen}"));
  assert.ok(header.includes("onClick={() => setMobileOpen((open) => !open)}"));
  assert.ok(menu.includes('id="mobile-navigation"'));
  assert.ok(menu.includes("<NavLink"));
  assert.ok(menu.includes('end={to === "/"}'));
  assert.ok(menu.includes("<CaretRight"));
  assert.ok(!menu.includes("ArrowUpRight"));
  assert.ok(!menu.includes("--menu-delay"));
  assert.match(styles, /\.mobile-menu__link\[aria-current="page"\][\s\S]*?font-weight:\s*600;/);
});

test("mobile navigation stays usable at short viewport heights and on narrow screens", async () => {
  const styles = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");

  assert.match(styles, /height: 100dvh;/);
  assert.match(styles, /padding-right: max\(24px, env\(safe-area-inset-right\)\);/);
  assert.match(styles, /padding-left: max\(24px, env\(safe-area-inset-left\)\);/);
  assert.match(styles, /\.mobile-menu__panel\s*\{[^}]*display:\s*flex;[^}]*overflow:\s*hidden;/s);
  assert.match(styles, /\.mobile-menu__nav\s*\{[^}]*overflow-y:\s*auto;/s);
  assert.match(styles, /overscroll-behavior: contain;/);
  assert.match(styles, /@media \(max-width: 360px\)[\s\S]*?\.site-header__actions \{\s*gap: 4px;/);
  assert.match(styles, /\.site-header__menu-toggle,[\s\S]*?min-width: 44px/);
});
