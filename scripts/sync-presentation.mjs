import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = new URL("../../stockmarket-convex/", import.meta.url);
const target = new URL("../src/website/", import.meta.url);
await mkdir(target, { recursive: true });
const files = ["RoundReveal.tsx", "RoundOverview.tsx", "RoundWealth.tsx", "StockPriceChart.tsx", "price-history.ts", "reveals.ts", "round-preview.ts", "FeedMessage.tsx", "GameResults.tsx", "FinalHoldings.tsx", "StockHistoryStrip.tsx", "stock-history.ts", "use-marquee.ts", "MobilePortfolio.tsx", "bootstrap.ts", "use-reveal-ready.ts", "RolePortrait.tsx", "StockRoleFooter.tsx", "CompanyHolding.tsx", "TradeRole.tsx"];
const selected = process.argv.slice(2);
const hashes = selected.length ? JSON.parse(await readFile(new URL("source.json", target), "utf8")).hashes : {};
for (const file of files.filter(file => !selected.length || selected.includes(file))) {
    const original = await readFile(new URL(`src/${file}`, source), "utf8");
    await writeFile(new URL(file, target), original.replaceAll('"../shared/settlement"', '"./settlement"').replaceAll('"../shared/presentation"', '"./timing"').replaceAll('"react-router-dom"', '"./navigation"').replaceAll('(min-width: 992px)', '(min-width: 0px)').replaceAll('.toSorted(', '.slice().sort(').replaceAll('"./display-types"', '"./types"').replaceAll('"../shared/company-roles"', '"../api"'));
    hashes[file] = createHash("sha256").update(original).digest("hex");
}
await writeFile(new URL("settlement.ts", target), await readFile(new URL("shared/settlement.ts", source)));
await writeFile(new URL("timing.ts", target), await readFile(new URL("shared/presentation.ts", source)));
await writeFile(new URL("company-roles.css", target), await readFile(new URL("src/company-roles.css", source)));
const patch = await readFile(new URL("src/patch.css", source), "utf8");
await writeFile(new URL("patch.css", target), patch.slice(patch.indexOf("#play-notif {"), patch.indexOf("/* On narrow panels")));
await writeFile(new URL("source.json", target), JSON.stringify({ source: "stockmarket-convex/src", hashes }, null, 2));
console.log("Copied website reveal, summary, wealth, chart, feed and settlement presentation sources.");
