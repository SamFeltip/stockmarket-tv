import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = new URL(process.env.STOCKMARKET_WEB_SOURCE || "../../stockmarket-convex/", import.meta.url);
const target = new URL("../src/website/", import.meta.url);
await mkdir(target, { recursive: true });
const files = ["RoundReveal.tsx", "RoundOverview.tsx", "RoundWealth.tsx", "StockPriceChart.tsx", "price-history.ts", "reveals.ts", "round-preview.ts", "FeedMessage.tsx", "GameResults.tsx", "FinalHoldings.tsx", "StockHistoryStrip.tsx", "stock-history.ts", "use-marquee.ts", "MobilePortfolio.tsx", "bootstrap.ts", "use-reveal-ready.ts", "RolePortrait.tsx", "StockRoleFooter.tsx", "CompanyHolding.tsx", "TradeRole.tsx", "CashReveal.tsx", "ShareSuspended.tsx", "SelectionTick.tsx", "RightsIssue.tsx", "GameMetrics.tsx", "DecisionPortfolios.tsx", "TradeStockSummary.tsx", "TradeInputs.tsx", "TradePosition.tsx", "trades.ts"];
const selected = process.argv.slice(2);
const hashes = selected.length ? JSON.parse(await readFile(new URL("source.json", target), "utf8")).hashes : {};
for (const file of files.filter(file => !selected.length || selected.includes(file))) {
    const original = await readFile(new URL(`src/${file}`, source), "utf8");
    const prefix = file === "CashReveal.tsx" ? 'import "./cash-reveal.css";\n' : "";
    await writeFile(new URL(file, target), prefix + original.replaceAll('"../shared/settlement"', '"./settlement"').replaceAll('"../shared/chance-cards"', '"./chance-cards"').replaceAll('"../shared/rights-issue"', '"./rights-issue"').replaceAll('"../shared/rules"', '"./rules"').replaceAll('"../shared/presentation"', '"./timing"').replaceAll('"react-router-dom"', '"./navigation"').replaceAll('(min-width: 992px)', '(min-width: 0px)').replaceAll('.toSorted(', '.slice().sort(').replaceAll('"./display-types"', '"./types"').replaceAll('"../shared/company-roles"', '"../api"'));
    hashes[file] = createHash("sha256").update(original).digest("hex");
}
await writeFile(new URL("settlement.ts", target), await readFile(new URL("shared/settlement.ts", source)));
await writeFile(new URL("chance-cards.ts", target), await readFile(new URL("shared/chance-cards.ts", source)));
await writeFile(new URL("suspensions.ts", target), (await readFile(new URL("shared/suspensions.ts", source), "utf8")).replaceAll('.toSorted(', '.slice().sort('));
await writeFile(new URL("rights-issue.ts", target), await readFile(new URL("shared/rights-issue.ts", source)));
await writeFile(new URL("company-roles.ts", target), (await readFile(new URL("shared/company-roles.ts", source), "utf8")).replaceAll('.toSorted(', '.slice().sort('));
await writeFile(new URL("rules.ts", target), await readFile(new URL("shared/rules.ts", source)));
for (const style of ["rights-issue.css", "trade-inputs.css"]) {
    await writeFile(new URL(style, target), await readFile(new URL(`src/${style}`, source)));
}
await writeFile(new URL("share-suspended.css", target), await readFile(new URL("src/share-suspended.css", source)));
const cashStyles = await readFile(new URL("src/patch.css", source), "utf8");
const cashStart = cashStyles.indexOf(".cash-reveal {");
await writeFile(new URL("cash-reveal.css", target), cashStart < 0 ? "" : cashStyles.slice(cashStart));
await writeFile(new URL("timing.ts", target), await readFile(new URL("shared/presentation.ts", source)));
await writeFile(new URL("company-roles.css", target), await readFile(new URL("src/company-roles.css", source)));
const patch = await readFile(new URL("src/patch.css", source), "utf8");
await writeFile(new URL("patch.css", target), patch.slice(patch.indexOf("#play-notif {"), patch.indexOf("/* On narrow panels")) + "\n" + patch.slice(patch.indexOf(".game-metrics {"), patch.indexOf(".game-title-button {")));
await writeFile(new URL("source.json", target), JSON.stringify({ source: "stockmarket-convex/src", hashes }, null, 2));
console.log("Copied website reveal, summary, wealth, chart, feed and settlement presentation sources.");
