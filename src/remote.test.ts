import { describe, it, expect } from "vitest";
import { directionalTarget, homeActionTarget } from "./remote";
import { joinUrl } from "./storage";
const boxes = [0, 1, 2, 3].map((n) => ({ left: n % 2 * 120, top: Math.floor(n / 2) * 80, width: 100, height: 60 }));
describe("TV remote navigation", () => {
    it("moves in the requested direction and stays at the outer edge", () => {
        expect(directionalTarget(boxes, 0, "ArrowRight")).toBe(1);
        expect(directionalTarget(boxes, 0, "ArrowDown")).toBe(2);
        expect(directionalTarget(boxes, 3, "ArrowUp")).toBe(1);
        expect(directionalTarget(boxes, 3, "ArrowLeft")).toBe(2);
        expect(directionalTarget(boxes, 0, "ArrowLeft")).toBe(0);
        expect(directionalTarget(boxes, -1, "ArrowRight")).toBe(0);
    });
    it("generates a phone game link and rejects unsafe schemes", () => {
        expect(joinUrl("https://stockmarket-convex.pages.dev", "tv-night")).toBe("https://stockmarket-convex.pages.dev/games/show/tv-night");
        expect(() => joinUrl("javascript:alert(1)", "tv")).toThrow();
    });
    it("keeps home actions on their own row and sends Down to the first recent game", () => {
        const actions = [0, 1];
        expect(homeActionTarget(0, "ArrowRight", actions, 2)).toBe(1);
        expect(homeActionTarget(1, "ArrowLeft", actions, 2)).toBe(0);
        expect(homeActionTarget(1, "ArrowRight", actions, 2)).toBe(1);
        expect(homeActionTarget(0, "ArrowDown", actions, 2)).toBe(2);
        expect(homeActionTarget(1, "ArrowDown", actions, 2)).toBe(2);
        expect(homeActionTarget(1, "ArrowDown", actions, -1)).toBeUndefined();
        expect(homeActionTarget(2, "ArrowRight", actions, 2)).toBeUndefined();
    });
});
