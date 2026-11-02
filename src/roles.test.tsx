import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Board } from "./api";
import { demo } from "./demo";
import { websiteBoard } from "./presentation";
import { previewRound } from "./website/round-preview";
import { RoundOverview } from "./website/RoundOverview";
import { RoundReveal } from "./website/RoundReveal";
import { StockRoleFooter } from "./website/StockRoleFooter";
import { Dashboard } from "./Dashboard";

const snapshot: Board = { ...demo,
    players: demo.players.map((player, index) => ({ ...player, roles: index === 0
        ? [{ stockKey: 7, role: "chairman" }, { stockKey: 8, role: "director" }]
        : index === 1 ? [{ stockKey: 7, role: "director" }] : [] })),
    reveal: { period: demo.game.currentPeriod, suspended: [],
        prices: demo.stocks.map(stock => ({ stockKey: stock.key, value: stock.value })),
        stocks: demo.stocks.map(stock => ({ ...stock, display: true,
            imagePath: `/static/imgs/stocks/${stock.key === 7 ? "thf.png" : "ub.png"}`,
            secondaryImagePath: "/static/imgs/logo.svg" })),
        insights: [
            { _id: "negative", playerId: "2", stockKey: 7, value: -1.5, description: "Trusthouse Forte Insight -1.5", resolved: false },
            { _id: "bonus-negative", playerId: "1", stockKey: 7, value: 1.5, description: "chairman bonus", resolved: true, bonusRole: "chairman", removedInsightId: "negative" },
            { _id: "director-negative", playerId: "1", stockKey: 8, value: -0.5, description: "UB Insight -0.5", resolved: false },
            { _id: "bonus-director", playerId: "1", stockKey: 8, value: 0.5, description: "director bonus", resolved: true, bonusRole: "director", removedInsightId: "director-negative" },
        ] },
};

describe("company roles on the standalone TV", () => {
    it("preserves bonuses through the public adapter and associates every role with its company", () => {
        const board = websiteBoard(snapshot);
        const after = previewRound(board, board.insights, [7,8]);
        const footer = renderToStaticMarkup(<StockRoleFooter board={board} stock={board.stocks[0]}/>);
        expect(footer).toContain('aria-label="Trusthouse Forte company roles"');
        expect(footer).toContain("Chairman");
        expect(footer).toContain("Director");
        expect(footer).toContain("+£1.50");
        expect(footer).toContain("chairman influence");
        expect(footer).not.toContain("chairman bonus");
        expect(footer).not.toContain("director bonus");
        const overview = renderToStaticMarkup(<RoundOverview before={board} after={after}/>);
        expect(overview).toContain('aria-label="UB company roles"');
        expect(overview).toContain("director bonus");
        expect(after.game.prices).toEqual(board.game.prices);
        for (const stock of board.stocks.slice(0,2)) {
            const insights = board.insights.filter(card => card.stockKey === stock.key);
            const reveal = renderToStaticMarkup(<RoundReveal board={board} preview={after} stock={stock} insights={insights} index={insights.length-1}/>);
            expect(reveal).toContain(stock.name);
            expect(reveal).toContain(stock.key === 7 ? "chairman influence" : "director bonus");
            expect(reveal).toContain(stock.key === 7 ? "chairman.svg" : "director.svg");
        }
        const dashboard = renderToStaticMarkup(<Dashboard board={snapshot} phoneUrl="https://example.com"/>);
        expect(dashboard).toContain('alt="Chairman of Trusthouse Forte"');
        expect(dashboard).toContain('alt="Director of Trusthouse Forte"');
    });
});
