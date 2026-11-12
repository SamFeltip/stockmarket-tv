export type Recent = { code: string; token?: string };
const key = "stockmarket-tv:v1";
function isRecent(item: unknown): item is Recent {
    if (typeof item !== "object" || item === null || !("code" in item)) return false;
    const token = "token" in item ? item.token : undefined;
    return typeof item.code === "string" && /^[a-z0-9_-]{1,32}$/.test(item.code)
        && (token === undefined || (typeof token === "string" && /^[a-f0-9]{64}$/.test(token)));
}
export function readRecent(): Recent[] {
    try {
        const data: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
        return Array.isArray(data) ? data.filter(isRecent).slice(0, 12) : [];
    } catch { return []; }
}
export function remember(entry: Recent) {
    const entries = readRecent();
    const old = entries.find((item) => item.code === entry.code);
    const next = [{ ...old, ...entry }, ...entries.filter((item) => item.code !== entry.code)].slice(0, 12);
    localStorage.setItem(key, JSON.stringify(next));
    return next;
}
const pendingKey = `${key}:pending-token`;

export function pendingLobbyToken() {
    const saved = localStorage.getItem(pendingKey);
    if (saved && /^[a-f0-9]{64}$/.test(saved)) return saved;

    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(pendingKey, token);
    return token;
}

export function clearPendingLobby() {
    localStorage.removeItem(pendingKey);
}
export function joinUrl(base: string, code: string) {
    const url = new URL(base);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("Phone URL must use HTTP or HTTPS");
    }
    return new URL(`/games/show/${encodeURIComponent(code)}`, url.origin).href;
}
