import { expect, it } from "vitest";
import { roundCash } from "./website/settlement";
import { cashStockKey } from "./website/chance-cards";

it("previews the shared backend's symmetric £500 cash adjustments", () => {
    const player = { _id: "player", cash: 45_000 };
    const card = { playerId: "player", stockKey: cashStockKey, value: 0.1 };

    expect(roundCash(player, [card], [])).toBe(49_500);
    expect(roundCash(player, [{ ...card, value: -0.1 }], [])).toBe(40_500);
    expect(roundCash({ ...player, cash: 55_000 }, [card], [])).toBe(60_500);
});
