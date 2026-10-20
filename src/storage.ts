export type Recent = { code: string; token?: string };
const key = "stockmarket-tv:v1";
export function readRecent(): Recent[] {
    try {
        const data: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
        return Array.isArray(data) ? data.filter((item): item is Recent => typeof item?.code === "string"
            && /^[a-z0-9_-]{1,32}$/.test(item.code)
            && (item.token === undefined || /^[a-f0-9]{64}$/.test(item.token))).slice(0, 12) : [];
    } catch { return []; }
}
export function remember(entry: Recent) {
    const entries = readRecent();
    const old = entries.find((item) => item.code === entry.code);
    const next = [{ ...old, ...entry }, ...entries.filter((item) => item.code !== entry.code)].slice(0, 12);
    localStorage.setItem(key, JSON.stringify(next));
    return next;
}
export function newLobby() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return { code: `tv-${[...bytes.slice(0, 4)].map((b) => b.toString(16).padStart(2, "0")).join("")}`,
        token: [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("") };
}
export function joinUrl(base: string, code: string) {
    const url = new URL(base);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("Phone URL must use HTTP or HTTPS");
    }
    return new URL(`/games/show/${encodeURIComponent(code)}`, url.origin).href;
}
