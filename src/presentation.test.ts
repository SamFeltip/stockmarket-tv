import { describe, it, expect } from "vitest";
import { boardFixture } from "./test-fixtures/board";
import { newPlayEvents, websiteBoard } from "./presentation";
import { roundProgress } from "./website/round-preview";

describe("public TV presentation", () => {
    it("queues new plays chronologically, including passes, while ignoring system events", () => {
        const feed = [
            { ...boardFixture.feed[0], id: "3", at: 3, colour: "grey" },
            { ...boardFixture.feed[3], id: "2", at: 2 },
            { ...boardFixture.feed[0], id: "1", at: 1 },
            { ...boardFixture.feed[0], id: "old", at: 0 },
        ];
        expect(newPlayEvents({ ...boardFixture, feed }, "old", 0).map((item) => item.id)).toEqual(["1", "2"]);
        expect(newPlayEvents({ ...boardFixture, feed }, "3", 3)).toEqual([]);
        expect(newPlayEvents({ ...boardFixture, feed }, "missing", 2)).toEqual([]);
    });
    it("cannot build a reveal from a playing board without public insights", () => {
        expect(() => websiteBoard(boardFixture)).toThrow("not public");
    });
    it("uses website settlement progressively, including cash insights and held prices", () => {
        const board = websiteBoard({ ...boardFixture, reveal: {
            period: 2, prices: boardFixture.stocks.map((stock) => ({ stockKey: stock.key, value: stock.value })), suspended: [7],
            stocks: [...boardFixture.stocks.map((stock) => ({ ...stock, display: true, imagePath: "/static/imgs/logo.svg", secondaryImagePath: "/static/imgs/logo.svg" })),
                { key: 100, name: "currency", display: false, imagePath: "", secondaryImagePath: "" }],
            insights: [
                { _id: "held", playerId: "1", stockKey: 7, value: 1, description: "Held", resolved: true },
                { _id: "cash", playerId: "1", stockKey: 100, value: .1, description: "Currency", resolved: true },
            ],
        } });
        const start = roundProgress(board, 0, 0);
        expect(start.wealth.players[0].cash).toBe(boardFixture.players[0].cash);
        const summary = roundProgress(board, 7, 0).preview;
        expect(summary.game.prices.find((p) => p.stockKey === 7)?.value).toBe(2.25);
        expect(summary.players[0].cash).toBe(49500);
    });
});

it("queues Government Loans as live actions without replaying them on reconnect", () => {
    const loan = { ...boardFixture.feed[0], id: "loan", at: 10, stockKey: undefined,
        quantity: undefined, cashBonus: 10000, message: "received government bonus" };
    const feed = [loan, { ...boardFixture.feed[0], id: "old", at: 9 }];
    expect(newPlayEvents({ ...boardFixture, feed }, "old", 9)).toEqual([loan]);
    expect(newPlayEvents({ ...boardFixture, feed }, "missing", 9)).toEqual([loan]);
    expect(newPlayEvents({ ...boardFixture, feed }, "loan", 10)).toEqual([]);
    expect(newPlayEvents({ ...boardFixture, feed })).toEqual([]);
});
