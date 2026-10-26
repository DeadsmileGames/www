import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("mobile navigation exposes its control relationship and current route", async () => {
  const [header, menu, styles] = await Promise.all([
    readFile(new URL("../src/components/layout/Header.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/navigation/MobileMenu.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/global.css", import.meta.url), "utf8"),
  ]);

  assert.ok(header.includes('aria-controls="mobile-navigation"'));
  assert.ok(header.includes('aria-label={t(mobileOpen ? "Close menu" : "Open menu")}'));
  assert.ok(header.includes("onClick={() => setMobileOpen((open) => !open)}"));
  assert.ok(menu.includes('id="mobile-navigation"'));
  assert.ok(menu.includes("<NavLink"));
  assert.ok(menu.includes('end={to === "/"}'));
  assert.match(styles, /\.mobile-menu__link\[aria-current="page"\]/);
});

test("mobile navigation adapts to safe areas and very narrow viewports", async () => {
  const styles = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");

  assert.match(styles, /height: 100dvh;/);
  assert.match(styles, /padding-right: max\(24px, env\(safe-area-inset-right\)\);/);
  assert.match(styles, /padding-left: max\(24px, env\(safe-area-inset-left\)\);/);
  assert.match(styles, /overscroll-behavior: contain;/);
  assert.match(styles, /@media \(max-width: 360px\)[\s\S]*?\.site-header__actions \{\s*gap: 4px;/);
  assert.match(styles, /\.site-header__menu-toggle,[\s\S]*?min-width: 44px/);
});
