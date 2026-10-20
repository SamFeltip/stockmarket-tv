import type { Board } from "./api";
import { asset, portrait } from "./assets";
import { roundPrices } from "./website/settlement";
import type { Board as WebsiteBoard } from "./website/types";

export function websiteBoard(board: Board): WebsiteBoard {
    const reveal = board.reveal;
    if (!reveal) throw new Error("Round insights are not public yet");
    return {
        game: { ...board.game, prices: reveal.prices, suspended: reveal.suspended, priceHistory: board.history },
        stocks: reveal.stocks.map((stock) => ({ ...stock, imagePath: asset(stock.imagePath), secondaryImagePath: asset(stock.secondaryImagePath) })),
        insights: reveal.insights,
        players: board.players.map(({ id, profileRoot, ...player }) => ({ ...player, _id: id, profileRoot: portrait(profileRoot) })),
        feed: board.feed,
    };
}

export function newPlayEvents(board: Board, previousId?: string, previousAt = Infinity) {
    const anchor = board.feed.findIndex((item) => item.id === previousId);
    const items = anchor >= 0 ? board.feed.slice(0, anchor) : board.feed.filter((item) => item.at > previousAt);
    return items.filter((item) => item.colour !== "grey" && (Boolean(item.quantity)
        || item.message === "passed their go")).reverse();
}

// Host advancement proves all hold decisions are resolved. Reconcile a missed
// hold update using the public settlement history before finishing the reveal.
export function settledRevealSnapshot(snapshot: Board, latest: Board): Board {
    if (!snapshot.reveal) return snapshot;
    const reveal = snapshot.reveal;
    const settled = latest.history.find((entry) => entry.period === reveal.period + 1)?.prices;
    const expected = roundPrices(reveal.prices, reveal.insights, reveal.stocks, []);
    const suspended = settled ? expected.filter((price) =>
        settled.some((actual) => actual.stockKey === price.stockKey && actual.value !== price.value))
        .map((price) => price.stockKey) : reveal.suspended;
    return { ...snapshot, reveal: { ...reveal, suspended,
        insights: reveal.insights.map((insight) => ({ ...insight, resolved: true })) } };
}
