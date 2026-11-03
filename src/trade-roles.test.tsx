import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { CompanyRole } from "./api";
import { boardFixture } from "./test-fixtures/board";
import { Feed } from "./Dashboard";
import { PlayAnimation } from "./PlayAnimation";

describe("trade role announcements on TV", () => {
    for (const [before, after, texts] of [
        [undefined, "director", ["new director"]],
        [undefined, "chairman", ["new chairman"]],
        ["director", "chairman", ["promoted to chairman"]],
        ["chairman", "chairman", []],
        ["chairman", "director", ["demoted to director"]],
        ["chairman", undefined, ["stepped down as chairman"]],
        ["director", undefined, ["stepped down as director"]],
    ] as [CompanyRole | undefined, CompanyRole | undefined, string[]][]) {
        it(`renders ${before ?? "no role"} to ${after ?? "no role"} from the recorded event`, () => {
            const event = { ...boardFixture.feed[0], stockKey: 8, quantity: after === "director" ? -10000 : 50000,
                roleBefore: before, roleAfter: after };
            const board = { ...boardFixture, feed: [event] };
            const popup = renderToStaticMarkup(<PlayAnimation board={board} preview/>);
            const feed = renderToStaticMarkup(<Feed board={board}/>);
            for (const html of [popup, feed]) {
                if (after) expect(html).toContain(`${after}.svg`);
                else expect(html).not.toContain("company-role-badge");
                if (!texts.length) {
                    expect(html).not.toContain("new chairman");
                    expect(html).not.toContain("stepped down");
                }
            }
            for (const text of texts) expect(popup).toContain(text);
            expect(feed).not.toContain("trade-role-change");
            expect(feed).not.toContain("new director");
            expect(feed).not.toContain("new chairman");
            expect(feed).not.toContain("stepped down");
            expect(feed).not.toContain("promoted to");
            expect(feed).not.toContain("demoted to");
            if (after) expect(feed).toContain(`class="trade-role-label">${after}</p>`);
        });
    }
});
