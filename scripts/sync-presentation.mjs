import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = new URL(process.env.STOCKMARKET_WEB_SOURCE || "../../stockmarket-convex/", import.meta.url);
const target = new URL("../src/website/", import.meta.url);
// Rule modules in the web app may forward to the parent workspace's shared engine.
// Vendor their implementation, preserving this standalone TV project's existing build layout.
async function readSharedRule(file) {
    const location = new URL(`shared/${file}`, source);
    const contents = await readFile(location, "utf8");
    const forwarded = contents.match(/export \* from "([^"]+)";/);
    return forwarded ? readFile(new URL(`${forwarded[1]}.ts`, location), "utf8") : contents;
}
await mkdir(target, { recursive: true });
const files = ["HomeStart.tsx", "use-round-reveal.ts", "use-wide-round-overview.ts", "SpectatorRoundPresentation.tsx", "RoundReveal.tsx", "RoundOverview.tsx", "RoundWealth.tsx", "StockPriceChart.tsx", "TradeMarkers.tsx", "price-history.ts", "reveals.ts", "round-preview.ts", "FeedMessage.tsx", "GameResults.tsx", "FinalHoldings.tsx", "StockHistoryStrip.tsx", "StockHistoryChart.tsx", "stock-history.ts", "Marquee.tsx", "use-marquee.ts", "MobilePortfolio.tsx", "bootstrap.ts", "use-reveal-ready.ts", "RolePortrait.tsx", "StockRoleFooter.tsx", "CompanyHolding.tsx", "TradeRole.tsx", "CashReveal.tsx", "ShareSuspended.tsx", "SuspensionStock.tsx", "SuspensionSkipConfirmation.tsx", "SelectionTick.tsx", "RightsIssue.tsx", "GameMetrics.tsx", "SpectatorHeader.tsx", "RightsIssueSpectatorDesktop.tsx", "RightsIssueSkip.tsx", "SpectatorDashboard.tsx", "spectator-board.ts", "DecisionPortfolios.tsx", "PortfolioTable.tsx", "TradeStockSummary.tsx", "TradeInputs.tsx", "TradePosition.tsx", "trades.ts", "PackControl.tsx", "PackIcon.tsx", "pack-presentation.ts", "GameLengthControl.tsx"];
const selected = process.argv.slice(2);
const hashes = selected.length ? JSON.parse(await readFile(new URL("source.json", target), "utf8")).hashes : {};
for (const file of files.filter(file => !selected.length || selected.includes(file))) {
    const spectatorRound = file === "SpectatorRoundPresentation.tsx";
    const sourcePath = spectatorRound ? "src/spectator/RoundPresentation.tsx" : `src/${file}`;
    const original = file === "reveals.ts" ? await readSharedRule(file) : await readFile(new URL(sourcePath, source), "utf8");
    const contents = spectatorRound
        ? original.replaceAll('"../../shared/', '"../shared/').replaceAll('"../', '"./').replaceAll('"./shared/', '"../shared/')
            .replace('from "../shared";', 'from "./shared";')
            .replace('from "./types";', 'from "../api";').replace('from "./presentation";', 'from "../presentation";')
        : original;
    const prefix = file === "CashReveal.tsx" ? 'import "./cash-reveal.css";\n' : "";
    await writeFile(new URL(file, target), prefix + contents.replaceAll('id: item._id, at: item._creationTime', 'id: item.id, at: item.at').replaceAll('item={{ ...item, _id: item.id, _creationTime: item.at }}', 'item={item}').replaceAll('"./spectator/types"', '"../api"').replaceAll('"./spectator/assets"', '"../assets"').replaceAll('"./spectator/spectator.css"', '"./spectator.css"').replaceAll('"./spectator/tv-display.css"', '"./tv-display.css"').replaceAll('"../shared/suspensions"', '"./suspensions"').replaceAll('"../shared/settlement"' , '"./settlement"').replaceAll('"../shared/chance-cards"', '"./chance-cards"').replaceAll('"../shared/rights-issue"', '"./rights-issue"').replaceAll('"../shared/rules"', '"./rules"').replaceAll('"../shared/packs"', '"./packs"').replaceAll('"../shared/presentation"', '"./timing"').replaceAll('"react-router-dom"', '"./navigation"').replaceAll('(min-width: 992px)', '(min-width: 0px)').replaceAll('.toSorted(', '.slice().sort(').replaceAll('.toReversed()', '.slice().reverse()').replaceAll('"./display-types"', '"./types"').replaceAll('"../shared/company-roles"', '"../api"'));
    hashes[file] = createHash("sha256").update(original).digest("hex");
}
await writeFile(new URL("settlement.ts", target), await readSharedRule("settlement.ts"));
await writeFile(new URL("chance-cards.ts", target), await readSharedRule("chance-cards.ts"));
await writeFile(new URL("suspensions.ts", target), (await readSharedRule("suspensions.ts")).replaceAll('.toSorted(', '.slice().sort('));
await writeFile(new URL("rights-issue.ts", target), await readSharedRule("rights-issue.ts"));
await writeFile(new URL("company-roles.ts", target), (await readSharedRule("company-roles.ts")).replaceAll('.toSorted(', '.slice().sort('));
await writeFile(new URL("rules.ts", target), await readSharedRule("rules.ts"));
await writeFile(new URL("packs.ts", target), await readSharedRule("packs.ts"));
await writeFile(new URL("timing.ts", target), await readSharedRule("presentation.ts"));
if (!selected.length || selected.includes("ShareSuspended.tsx") || selected.includes("share-suspended.css")) {
    await writeFile(new URL("share-suspended.css", target), await readFile(new URL("src/share-suspended.css", source)));
}
const styles = ["round-desktop.css", "rights-issue.css", "trade-inputs.css", "portfolio-table.css", "spectator-header.css", "rights-spectator-desktop.css", "pack-control.css", "play-style-card.css", "game-length.css", "insight-reveal.css"];
for (const style of styles.filter(file => !selected.length || selected.includes(file))) {
    await writeFile(new URL(style, target), await readFile(new URL(`src/${style}`, source)));
}
if (!selected.length) {
    const cashStyles = await readFile(new URL("src/patch.css", source), "utf8");
    const cashStart = cashStyles.indexOf(".cash-reveal {");
    await writeFile(new URL("cash-reveal.css", target), cashStart < 0 ? "" : cashStyles.slice(cashStart));
    await writeFile(new URL("company-roles.css", target), await readFile(new URL("src/company-roles.css", source)));
    const patch = await readFile(new URL("src/patch.css", source), "utf8");
    await writeFile(new URL("patch.css", target), patch.slice(patch.indexOf("#play-notif {"), patch.indexOf("/* On narrow panels")) + "\n" + patch.slice(patch.indexOf(".game-metrics {"), patch.indexOf(".game-title-button {")));
}
await writeFile(new URL("source.json", target), JSON.stringify({ source: "stockmarket-convex/src", hashes }, null, 2));
console.log("Copied website reveal, summary, wealth, chart, feed and settlement presentation sources.");

for (const style of ["spectator.css", "tv-display.css"].filter(file => !selected.length || selected.includes(file))) {
    await writeFile(new URL(style, target), await readFile(new URL(`src/spectator/${style}`, source)));
}
