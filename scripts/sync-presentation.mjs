import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = new URL("../../stockmarket.js/", import.meta.url);
const target = new URL("../src/website/", import.meta.url);
await mkdir(target, { recursive: true });
const files = ["RoundReveal.tsx", "RoundOverview.tsx", "RoundWealth.tsx", "StockPriceChart.tsx", "price-history.ts", "reveals.ts", "round-preview.ts", "FeedMessage.tsx"];
const hashes = {};
for (const file of files) {
    const original = await readFile(new URL(`src/${file}`, source), "utf8");
    await writeFile(new URL(file, target), original.replace('"../shared/settlement"', '"./settlement"'));
    hashes[file] = createHash("sha256").update(original).digest("hex");
}
await writeFile(new URL("settlement.ts", target), await readFile(new URL("shared/settlement.ts", source)));
const patch = await readFile(new URL("src/patch.css", source), "utf8");
await writeFile(new URL("patch.css", target), patch.slice(patch.indexOf("#play-notif {"), patch.indexOf("main:has(> .game-results)"))
    + patch.slice(patch.indexOf(".round-end:not(:has(.round-overview))"), patch.indexOf("/* On narrow panels")));
await writeFile(new URL("source.json", target), JSON.stringify({ source: "stockmarket.js/src", hashes }, null, 2));
console.log("Copied website reveal, summary, wealth, chart, feed and settlement presentation sources.");
