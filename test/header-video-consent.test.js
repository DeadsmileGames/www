import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("authenticated account menu shows the account icon when no usable avatar exists", async () => {
  const source = await readFile(
    new URL("../src/components/layout/Header.jsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /\{avatar \? \([\s\S]*?className="account-avatar"[\s\S]*?\) : \(\s*<UserCircle size=\{24\} weight="bold" aria-hidden="true" \/>[\s\S]*?\)\}/,
  );
  assert.match(source, /<CaretDown weight="bold" size=\{13\} \/>/);
});

test("video and trailer consent uses the soundtrack player design with a YouTube icon", async () => {
  const [overlay, soundtrack, styles] = await Promise.all([
    readFile(new URL("../src/components/videos/VideoOverlay.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Soundtracks.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/global.css", import.meta.url), "utf8"),
  ]);

  assert.match(
    overlay,
    /"video-dialog video-overlay__player"\s*\+\s*\(embed && !allowed \? " soundtrack-overlay__player" : ""\)/,
  );
  assert.match(overlay, /<div className="soundtrack-overlay__consent">/);
  assert.match(overlay, /<YoutubeLogo size=\{30\} weight="fill" aria-hidden="true" \/>/);
  assert.match(overlay, /onClick=\{\(\) => setOptionalContent\(true\)\}/);
  assert.match(soundtrack, /className="soundtrack-overlay__consent"/);
  assert.match(styles, /\.soundtrack-overlay__player\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9;/s);
  assert.match(
    styles,
    /\.soundtrack-overlay__consent\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*background:\s*radial-gradient/s,
  );
});
