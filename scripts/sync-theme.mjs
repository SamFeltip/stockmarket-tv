import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = new URL("../../stockmarket.js/public/static/", import.meta.url);
const target = new URL("../public/static/", import.meta.url);
await mkdir(target, { recursive: true });
for (const directory of ["imgs", "fonts", "stylesheets"]) {
    await cp(new URL(directory, source), new URL(directory, target), { recursive: true });
}
await mkdir(new URL("packages/", target), { recursive: true });
await cp(new URL("packages/bootstrap.min.css", source), new URL("packages/bootstrap.min.css", target));
const files = ["fonts/BigCaslon.ttf", "stylesheets/styles.css", "packages/bootstrap.min.css"];
const hashes = {};
for (const file of files) hashes[file] = createHash("sha256").update(await readFile(new URL(file, target))).digest("hex");
await writeFile(new URL("theme-source.json", target), JSON.stringify({ source: "stockmarket.js/public/static", hashes }, null, 2));
console.log("Copied the website’s original theme, fonts, portraits, icons and company assets into the standalone TV project.");
