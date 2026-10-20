import { describe, it, expect } from "vitest";
import { demo } from "./demo";
import { newPlayEvents, settledRevealSnapshot, websiteBoard } from "./presentation";
import { roundProgress } from "./website/round-preview";

describe("public TV presentation", () => {
    it("queues new plays chronologically, including passes, while ignoring system events", () => {
        const feed = [
            { ...demo.feed[0], id: "3", at: 3, colour: "grey" },
            { ...demo.feed[3], id: "2", at: 2 },
            { ...demo.feed[0], id: "1", at: 1 },
            { ...demo.feed[0], id: "old", at: 0 },
        ];
        expect(newPlayEvents({ ...demo, feed }, "old", 0).map((item) => item.id)).toEqual(["1", "2"]);
        expect(newPlayEvents({ ...demo, feed }, "3", 3)).toEqual([]);
        expect(newPlayEvents({ ...demo, feed }, "missing", 2)).toEqual([]);
    });
    it("cannot build a reveal from a playing board without public insights", () => {
        expect(() => websiteBoard(demo)).toThrow("not public");
    });
    it("reconciles a hold decision when the phone host advances before the TV sees its update", () => {
        const snapshot = { ...demo, reveal: { period: 2, prices: [{ stockKey: 7, value: 2 }], suspended: [],
            stocks: [{ key: 7, display: true, name: "Trusthouse Forte", imagePath: "", secondaryImagePath: "" }],
            insights: [{ _id: "a", playerId: "1", stockKey: 7, value: 1, description: "Change", resolved: false }] } };
        const reconciled = settledRevealSnapshot(snapshot, { ...demo, history: [{ period: 3, prices: [{ stockKey: 7, value: 2 }] }] });
        expect(reconciled.reveal?.suspended).toEqual([7]);
        expect(reconciled.reveal?.insights[0].resolved).toBe(true);
        expect(snapshot.reveal.insights[0].resolved).toBe(false);
    });
    it("uses website settlement progressively, including cash insights and held prices", () => {
        const board = websiteBoard({ ...demo, reveal: {
            period: 2, prices: demo.stocks.map((stock) => ({ stockKey: stock.key, value: stock.value })), suspended: [7],
            stocks: [...demo.stocks.map((stock) => ({ ...stock, display: true, imagePath: "/static/imgs/logo.svg", secondaryImagePath: "/static/imgs/logo.svg" })),
                { key: 100, name: "currency", display: false, imagePath: "", secondaryImagePath: "" }],
            insights: [
                { _id: "held", playerId: "1", stockKey: 7, value: 1, description: "Held", resolved: true },
                { _id: "cash", playerId: "1", stockKey: 100, value: .1, description: "Currency", resolved: true },
            ],
        } });
        const start = roundProgress(board, 0, 0);
        expect(start.wealth.players[0].cash).toBe(demo.players[0].cash);
        const summary = roundProgress(board, 7, 0).preview;
        expect(summary.game.prices.find((p) => p.stockKey === 7)?.value).toBe(2.25);
        expect(summary.players[0].cash).toBe(49500);
    });
});
