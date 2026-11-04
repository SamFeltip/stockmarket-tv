import { afterEach, expect, it, vi } from "vitest";
import { readRecent, remember } from "./storage";

afterEach(() => vi.unstubAllGlobals());

function stored(value: string) {
    let saved = value;
    vi.stubGlobal("localStorage", {
        getItem: () => saved,
        setItem: (_key: string, next: string) => { saved = next; },
    });
}

it("reads valid recent games and rejects malformed records without coercing tokens", () => {
    const token = "a".repeat(64);
    const valid = [{ code: "tv-night" }, { code: "saved_game", token }];
    stored(JSON.stringify([...valid, null, 1, "game", {}, { code: "invalid code" },
        { code: "bad-token", token: [token] }, { code: "bad-token", token: 1 }]));
    expect(readRecent()).toEqual(valid);
});

it("returns no recent games for invalid JSON or a non-array value", () => {
    for (const value of ["invalid-json", "null", "{}", "1"]) {
        stored(value);
        expect(readRecent()).toEqual([]);
    }
});

it("keeps the twelve most recent records", () => {
    const entries = Array.from({ length: 15 }, (_, index) => ({ code: `game-${index}` }));
    stored(JSON.stringify(entries));
    expect(readRecent()).toEqual(entries.slice(0, 12));
});

it("moves an existing game to the front while retaining its host token", () => {
    const entry = { code: "hosted", token: "b".repeat(64) };
    stored(JSON.stringify([{ code: "other" }, entry]));
    expect(remember({ code: "hosted" })).toEqual([entry, { code: "other" }]);
    expect(readRecent()).toEqual([entry, { code: "other" }]);
});
