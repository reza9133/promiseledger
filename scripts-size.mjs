// Prints raw + gzip size of every built asset, and the JS needed by the first route.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const dir = "dist/assets";
const rows = readdirSync(dir)
  .map((f) => {
    const buf = readFileSync(join(dir, f));
    return { f, raw: statSync(join(dir, f)).size, gz: gzipSync(buf).length };
  })
  .sort((a, b) => b.raw - a.raw);
const kb = (n) => (n / 1024).toFixed(1).padStart(8) + " kB";
console.log("asset".padEnd(44), "raw".padStart(11), "gzip".padStart(11));
for (const r of rows) console.log(r.f.padEnd(44), kb(r.raw), kb(r.gz));

const html = readFileSync("dist/index.html", "utf8");
const initial = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.(?:js|css))"/g)].map((m) => m[1]);
const seen = new Set(initial);
// follow static imports of the entry chunks (modulepreload links are already listed in the html)
let rawJs = 0, gzJs = 0, rawCss = 0, gzCss = 0;
for (const f of seen) {
  const r = rows.find((x) => x.f === f);
  if (!r) continue;
  if (f.endsWith(".js")) { rawJs += r.raw; gzJs += r.gz; } else { rawCss += r.raw; gzCss += r.gz; }
}
console.log("\nInitial route (index.html references):", [...seen].join(", "));
console.log(`  JS  ${kb(rawJs)} raw, ${kb(gzJs)} gzip`);
console.log(`  CSS ${kb(rawCss)} raw, ${kb(gzCss)} gzip`);
