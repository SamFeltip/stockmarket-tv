import { ConvexProvider, ConvexReactClient } from "convex/react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { boardFixture } from "./test-fixtures/board";
import type { Board } from "./api";
import { websiteBoard } from "./presentation";
import { ShareSuspended } from "./website/ShareSuspended";
import { RoundPresentation } from "./RoundPresentation";
import { revealGroups } from "./website/reveals";
import { pendingSuspensions } from "./website/suspensions";
import { previewRound } from "./website/round-preview";

const snapshot: Board = { ...boardFixture, game: { ...boardFixture.game, status: "closed", currentPeriod: 1 }, feed: [],
    reveal: { period: 1, suspensionPeriod: 1, suspended: [],
        prices: boardFixture.stocks.map(stock => ({stockKey: stock.key, value: stock.value})),
        stocks: boardFixture.stocks.map(stock => ({...stock, display: true, variation: stock.key,
            imagePath: "/static/imgs/stocks/thf.png", secondaryImagePath: "/static/imgs/stocks/thf.png"})),
        insights: [
            {_id:"card-1",playerId:boardFixture.players[1].id,period:1,stockKey:-2,value:0,description:"Share Suspended",chanceKind:"hold",resolved:false},
            {_id:"card-2",playerId:boardFixture.players[0].id,period:1,stockKey:-2,value:0,description:"Share Suspended",chanceKind:"hold",resolved:false},
        ] },
};

it("shows the current actor, portfolios and a spectator override on the TV after stock and cash reveals", () => {
    const client = new ConvexReactClient("https://tv-suspension.invalid");
    const board = websiteBoard(snapshot);
    expect(revealGroups(board.stocks, board.insights).at(-1)?.key).toBe(-1);
    expect(pendingSuspensions(1,board.players,board.insights).map(card=>card._id)).toEqual(["card-1","card-2"]);
    const html = renderToStaticMarkup(<ConvexProvider client={client}><RoundPresentation snapshot={snapshot}
        canAdvance onNext={()=>undefined} onBack={()=>undefined} busy={false} error=""/></ConvexProvider>);
    expect(html).toContain("Alex is deciding which stock valuation to suspend");
    expect(html).toContain("Player portfolios");
    expect(html).toContain(">Skip</button>");
    expect(html).not.toContain(">Next Period");
    expect(html).not.toContain('type="radio"');
});

it("keeps suspension previews compatible with older TV WebViews", () => {
    const unsupported = vi.spyOn(Array.prototype,"toSorted").mockImplementation(()=>{throw new Error("Unavailable");});
    try {
        const board = websiteBoard(snapshot);
        expect(previewRound(board,board.insights,[]).game.prices).toEqual(board.game.prices);
        expect(pendingSuspensions(1,board.players,board.insights)).toHaveLength(2);
        expect(renderToStaticMarkup(<ShareSuspended board={board} card={board.insights[0]} spectator/>))
            .toContain("Player portfolios");
    } finally { unsupported.mockRestore(); }
});
