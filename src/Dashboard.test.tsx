import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Dashboard } from "./Dashboard";
import { boardFixture } from "./test-fixtures/board";

it("keeps stock cards and portfolio columns in the server's pack-specific volatility order", () => {
    const order = [8, 9, 10, 11, 7, 12];
    const stocks = order.map((key) => boardFixture.stocks.find((stock) => stock.key === key)!);
    const board = { ...boardFixture, stocks, players: [{ ...boardFixture.players[0],
        holdings: stocks.map((stock) => ({ stockKey: stock.key, quantity: stock.key })),
    }] };
    const html = renderToStaticMarkup(<Dashboard board={board} phoneUrl="https://example.com"/>);
    const names = ["UB", "Legal &amp; General", "Thames", "Saatchi &amp; Saatchi", "Trusthouse Forte", "Natwest"];
    expect([...html.matchAll(/<h3>(.*?)<\/h3>/g)].slice(0, 6).map((match) => match[1])).toEqual(names);
    const header = html.match(/<thead>(.*?)<\/thead>/)![1];
    expect([...header.matchAll(/alt="(.*?)"/g)].map((match) => match[1])).toEqual(names);
    const body = html.match(/<tbody>(.*?)<\/tbody>/)![1];
    expect([...body.matchAll(/<td>(\d+)<\/td>/g)].map((match) => Number(match[1])))
        .toEqual(order);
    expect(board.stocks.map((stock) => stock.key)).toEqual(order);
});
