import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Dashboard } from "./Dashboard";
import { demo } from "./demo";

it("orders stock cards and portfolio columns by volatility and keeps holdings aligned", () => {
    const stocks = [10, 12, 8, 11, 7, 9].map((key) => demo.stocks.find((stock) => stock.key === key)!);
    const board = { ...demo, stocks, players: [{ ...demo.players[0],
        holdings: stocks.map((stock) => ({ stockKey: stock.key, quantity: stock.key })),
    }] };
    const html = renderToStaticMarkup(<Dashboard board={board} phoneUrl="https://example.com"/>);
    const names = ["Trusthouse Forte", "UB", "Legal &amp; General", "Thames", "Saatchi &amp; Saatchi", "Natwest"];
    expect([...html.matchAll(/<h3>(.*?)<\/h3>/g)].slice(0, 6).map((match) => match[1])).toEqual(names);
    const header = html.match(/<thead>(.*?)<\/thead>/)![1];
    expect([...header.matchAll(/alt="(.*?)"/g)].map((match) => match[1])).toEqual(names);
    const body = html.match(/<tbody>(.*?)<\/tbody>/)![1];
    expect([...body.matchAll(/<td>(\d+)<\/td>/g)].map((match) => Number(match[1])))
        .toEqual([7, 8, 9, 10, 11, 12]);
    expect(board.stocks.map((stock) => stock.key)).toEqual([10, 12, 8, 11, 7, 9]);
});
