import type { Board } from "./api";
import { asset, portrait, stockLogo } from "./assets";
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

export function resultsBoard(board: Board): WebsiteBoard {
    const ranked = [...board.players].sort((a, b) => b.netWorth - a.netWorth);
    return {
        game: { ...board.game, prices: board.stocks.map((stock) => ({ stockKey: stock.key, value: stock.value })),
            suspended: [], priceHistory: board.history },
        stocks: board.stocks.map((stock) => ({ key: stock.key, name: stock.name, display: true,
            imagePath: stockLogo(stock.key, stock.imagePath), secondaryImagePath: stockLogo(stock.key, stock.imagePath) })),
        insights: [], players: board.players.map(({ id, profileRoot, ...player }) => ({ ...player,
            _id: id, profileRoot: portrait(profileRoot), ranking: ranked.findIndex((item) => item.id === id) + 1 })),
        feed: board.feed,
    };
}
