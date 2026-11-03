import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { demo } from "./demo";
import { resultsBoard } from "./presentation";
import { RightsIssue } from "./website/RightsIssue";

it("renders public Rights Issue progress, portfolios and spectator controls without private cards", () => {
    const actor = demo.players[0].id;
    const board = resultsBoard({ ...demo, game: { ...demo.game, rightsIssue: {
        insightId: "rights", stockKey: 8, actorPlayerId: actor, period: demo.game.currentPeriod,
        turn: demo.game.turn, index: 0, offers: [{ playerId: actor, held: 2000, maximum: 1000 }],
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
