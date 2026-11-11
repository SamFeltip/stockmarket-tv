import type { ChartTrade } from "./website/price-history";
import type { Pack } from "./website/packs";
import type { RightsIssue } from "./website/rights-issue";
import { makeFunctionReference } from "convex/server";

export { companyRoleThresholds } from "./website/company-roles";

export type CompanyRole = "chairman" | "director";

export type PublicReveal = {
    period: number;
    trades?: ChartTrade[];
    prices: { stockKey: number; value: number }[];
    suspended: number[]; suspensionPeriod?: number;
    stocks: { key: number; name: string; display: boolean; imagePath: string; secondaryImagePath: string; variation?: number }[];
    insights: { _id: string; playerId: string; stockKey: number; value: number; description: string; resolved: boolean;
        chanceKind?: "rights" | "hold" | "loan" | "debenture" | "option"; used?: boolean; period?: number; bonusRole?: CompanyRole; removedInsightId?: string }[];
};
export type Board = {
    reveal?: PublicReveal | null;
    latestPurchase: { title: string; message: string } | null;
    game: { code: string; status: "waiting" | "playing" | "closed" | "special_insights" | "finished";
        pack?: Pack; tradingDates?: { from: string; to: string };
        rightsIssue?: RightsIssue; tvControlled?: boolean; currentPeriod: number; periodCount: number; turn: number; currentPlayerId?: string };
    stocks: { key: number; name: string; imagePath?: string; secondaryImagePath?: string; startingValue: number; value: number; held: number }[];
    players: { id: string; name: string; profileRoot?: string; cash: number; netWorth: number;
        holdings: { stockKey: number; quantity: number }[]; roles?: { stockKey: number; role: CompanyRole }[] }[];
    history: { period: number; prices: { stockKey: number; value: number }[];
        steps?: { stockKey: number; values: number[]; count: number }[] }[];
    feed: { id: string; at: number; period: number; title: string; message: string;
        imageRoot?: string; colour?: string; stockKey?: number; quantity?: number; cashBonus?: number; debenturePayout?: number; roleBefore?: CompanyRole; roleAfter?: CompanyRole }[];
};

export const tv = {
    board: makeFunctionReference<"query", { code: string }, Board | null>("tv:board"),
    create: makeFunctionReference<"mutation", { code: string; periodCount: number; token: string; pack?: Pack }, string>("tv:create"),
    setPack: makeFunctionReference<"mutation", { code: string; token: string; pack: Pack }, null>("tv:setPack"),
    next: makeFunctionReference<"mutation", { code: string; token: string; expectedPeriod: number }, null>("tv:next"),
    start: makeFunctionReference<"mutation", { code: string; token: string }, null>("tv:start"),
};

export const rounds = {
    beginSuspensions: makeFunctionReference<"mutation", { code: string; expectedPeriod: number }, null>("rounds:beginSuspensions"),
    skipSuspension: makeFunctionReference<"mutation", { code: string; expectedPeriod: number; insightId: string }, null>("rounds:skipSuspension"),
};

export const rightsIssue = {
    skip: makeFunctionReference<"mutation", { code: string; insightId: string; expectedIndex: number }, null>("rightsIssue:skip"),
};
