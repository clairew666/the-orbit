import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("provides a complete installable manifest", async () => {
  const manifest = JSON.parse(await readFile(new URL("public/manifest.webmanifest", root), "utf8"));
  assert.equal(manifest.short_name, "THE ORBIT");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/?source=pwa");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));
  await Promise.all(manifest.icons.map((icon) => access(new URL(`public${icon.src}`, root))));
});

test("registers an offline service worker and install flow", async () => {
  const [worker, page, layout] = await Promise.all([
    readFile(new URL("public/sw.js", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);
  assert.match(worker, /self\.addEventListener\("install"/);
  assert.match(worker, /self\.addEventListener\("fetch"/);
  assert.match(page, /serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(page, /beforeinstallprompt/);
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(layout, /appleWebApp/);
});
