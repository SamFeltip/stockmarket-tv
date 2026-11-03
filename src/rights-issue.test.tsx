import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { boardFixture } from "./test-fixtures/board";
import { resultsBoard } from "./presentation";
import { RightsIssue } from "./website/RightsIssue";

it("renders public Rights Issue progress, portfolios and spectator controls without private cards", () => {
    const actor = boardFixture.players[0].id;
    const board = resultsBoard({ ...boardFixture, game: { ...boardFixture.game, rightsIssue: {
        insightId: "rights", stockKey: 8, actorPlayerId: actor, period: boardFixture.game.currentPeriod,
        turn: boardFixture.game.turn, index: 0, offers: [{ playerId: actor, held: 2000, maximum: 1000 }],
    } } });
    const html = renderToStaticMarkup(<RightsIssue board={board} spectator/>);
    expect(html).toContain("Rights Issue");
    expect(html).toContain("Player portfolios");
    expect(html).toContain("Trading paused during Rights Issue");
    expect(html).not.toContain("trade-inputs");
    expect(html).toContain(">Skip</button>");
    board.game.rightsIssue!.completed = true;
    expect(renderToStaticMarkup(<RightsIssue board={board} spectator/>)).not.toContain(">Skip</button>");
});

it("routes a live public Rights Issue through the connected game screen", async () => {
    const { ConvexProvider, ConvexReactClient } = await import("convex/react");
    const { GameScreen } = await import("./App");
    const actor = boardFixture.players[0].id;
    const board = { ...boardFixture, game: { ...boardFixture.game, rightsIssue: {
        insightId: "live-rights", stockKey: 8, actorPlayerId: actor,
        period: boardFixture.game.currentPeriod, turn: boardFixture.game.turn, index: 0,
        offers: [{ playerId: actor, held: 2000, maximum: 1000 }],
    } } };
    const client = new ConvexReactClient("https://tv-rights.invalid");
    try {
        const html = renderToStaticMarkup(<ConvexProvider client={client}>
            <GameScreen board={board} phoneUrl="https://stockmarket.samfelton.com"
                busy={false} error="" onStart={() => {}} onBack={() => {}}/>
        </ConvexProvider>);
        expect(html).toContain("Trading paused during Rights Issue");
        expect(html).toContain("Player portfolios");
        expect(html).toContain(">Skip</button>");
        expect(html).not.toContain("trade-inputs");
    } finally { await client.close(); }
});
