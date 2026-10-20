// Public presentation types; no account, private player, or mutation capability.
import type { PublicReveal, Board as SpectatorBoard } from "../api";
export type Stock = PublicReveal["stocks"][number];
export type Insight = PublicReveal["insights"][number];
export type Player = Omit<SpectatorBoard["players"][number], "id" | "profileRoot"> & { _id: string; profileRoot: string; ranking?: number };
export type Board = {
    game: SpectatorBoard["game"] & { prices: PublicReveal["prices"]; suspended: number[]; priceHistory?: SpectatorBoard["history"] };
    stocks: Stock[]; insights: Insight[]; players: Player[];
    feed: SpectatorBoard["feed"];
};
