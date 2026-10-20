import type { Board } from "./api";
const opening = [2, 2.5, 4, 5.5, 7.5, 9];
const values = [2.25, 2.1, 4.3, 5.8, 7.2, 9.4];
const names = ["Trusthouse Forte", "UB", "Legal & General", "Thames", "Saatchi & Saatchi", "Natwest"];
const players = ["Sam", "Alex", "Morgan", "Charlie", "Taylor", "Robin"].map((name, index) => {
    const holdings = values.map((_, i) => ({ stockKey: i + 7, quantity: ((i + index) % 3) * 1000 }));
    const cash = 45000 - index * 1400;
    return { id: String(index + 1), name, profileRoot: `/static/imgs/${index % 5 + 1}profile.png`, cash, holdings,
        netWorth: cash + holdings.reduce((sum, h, i) => sum + h.quantity * values[i], 0) };
});
export const demo: Board = {
    latestPurchase: { title: "Sam", message: "bought 5000 shares in Thames" },
    game: { code: "market-night", status: "playing", currentPeriod: 2, periodCount: 5, turn: 5, currentPlayerId: "2" },
    stocks: names.map((name, i) => ({ key: i + 7, name, startingValue: opening[i], value: values[i],
        held: players.reduce((sum, p) => sum + p.holdings[i].quantity, 0) })),
    players,
    history: [0, 1, 2].map((period) => ({ period, prices: values.map((value, i) => ({ stockKey: i + 7,
        value: period === 0 ? opening[i] : period === 2 ? value : opening[i] + Math.sin(i + 1) * .4,
    })) })),
    feed: ["bought 5000 shares in Thames", "bought 1000 shares in Natwest", "sold 1000 shares in UB", "passed their go"].map((message, i) => ({
        id: String(i), at: 0, period: 2, title: ["Sam", "Robin", "Taylor", "Alex"][i], message,
        ...(i < 3 ? { stockKey: [10, 12, 8][i], quantity: i === 2 ? -1000 : i === 0 ? 5000 : 1000 } : {}),
    })),
};
