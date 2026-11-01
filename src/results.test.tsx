import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { demo } from "./demo";
import { resultsBoard } from "./presentation";
import { GameScreen } from "./App";
import { RoundOverview } from "./website/RoundOverview";
import { previewRound } from "./website/round-preview";

describe("TV game over", () => {
    it("renders results and round summaries on older WebViews without toSorted", () => {
        const unsupported = vi.spyOn(Array.prototype, "toSorted").mockImplementation(() => {
            throw new Error("toSorted is unavailable on this WebView");
        });
        try {
            const before = resultsBoard(demo);
            const after = previewRound(before, [], []);
            expect(renderToStaticMarkup(<RoundOverview before={before} after={after}/>)).toContain("Sam");
            expect(renderToStaticMarkup(<GameScreen board={{ ...demo, game: { ...demo.game, status: "finished" } }}
                phoneUrl="https://stockmarket.samfelton.com" onStart={()=>{}} onBack={()=>{}} busy={false} error=""/>))
                .toContain("Sam wins!");
        } finally { unsupported.mockRestore(); }
    });
    it("adapts final public rankings, holdings and prices to the original website components", () => {
        const board = resultsBoard({ ...demo, game: { ...demo.game, status: "finished" } });
        expect(board.insights).toEqual([]);
        expect(board.players.find(p=>p.name === "Sam")?.ranking).toBe(1);
        expect(board.game.prices).toHaveLength(6);
    });
    it("renders the web game-over screen rather than retaining insight reveal controls", () => {
        const html = renderToStaticMarkup(<GameScreen board={{ ...demo, game: { ...demo.game, status: "finished" } }}
            phoneUrl="https://stockmarket.samfelton.com" onStart={()=>{}} onBack={()=>{}} busy={false} error=""/>);
        expect(html).toContain("Sam wins!");
        expect(html).toContain("Final rankings");
        expect(html).toContain("Final stock price histories");
        expect(html).toContain("Sam&#x27;s portfolio");
        expect(html).not.toContain("Continue to game");
        expect(html).not.toContain("End of round");
    });
});
