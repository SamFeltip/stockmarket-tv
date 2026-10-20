import { makeFunctionReference } from "convex/server";

export type PublicReveal = {
    period: number;
    prices: { stockKey: number; value: number }[];
    suspended: number[];
    stocks: { key: number; name: string; display: boolean; imagePath: string; secondaryImagePath: string }[];
    insights: { _id: string; playerId: string; stockKey: number; value: number; description: string; resolved: boolean }[];
};
export type Board = {
    reveal?: PublicReveal | null;
    latestPurchase: { title: string; message: string } | null;
    game: { code: string; status: "waiting" | "playing" | "closed" | "special_insights" | "finished";
        currentPeriod: number; periodCount: number; turn: number; currentPlayerId?: string };
    stocks: { key: number; name: string; imagePath?: string; startingValue: number; value: number; held: number }[];
    players: { id: string; name: string; profileRoot?: string; cash: number; netWorth: number;
        holdings: { stockKey: number; quantity: number }[] }[];
    history: { period: number; prices: { stockKey: number; value: number }[] }[];
    feed: { id: string; at: number; period: number; title: string; message: string;
        imageRoot?: string; colour?: string; stockKey?: number; quantity?: number }[];
};

export const tv = {
    board: makeFunctionReference<"query", { code: string }, Board | null>("tv:board"),
    create: makeFunctionReference<"mutation", { code: string; periodCount: number; token: string }, string>("tv:create"),
    start: makeFunctionReference<"mutation", { code: string; token: string }, null>("tv:start"),
};
