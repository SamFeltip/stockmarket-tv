// Public presentation types; no account, private player, or mutation capability.
import type { PublicReveal, Board as SpectatorBoard } from "../api";
export type Stock = PublicReveal["stocks"][number] & { startingValue?: number };
export type Insight = PublicReveal["insights"][number];
export type Player = Omit<SpectatorBoard["players"][number], "id" | "profileRoot"> & { _id: string; profileRoot: string; ranking?: number };
export type Board = {
    game: SpectatorBoard["game"] & { prices: PublicReveal["prices"]; suspended: number[]; targetedSuspensions?: PublicReveal["targetedSuspensions"]; suspensionPeriod?: number; revealProgress?: PublicReveal["revealProgress"]; priceHistory?: SpectatorBoard["history"] };
    trades?: PublicReveal["trades"];
    stocks: Stock[]; insights: Insight[]; players: Player[];
    feed: SpectatorBoard["feed"];
};
