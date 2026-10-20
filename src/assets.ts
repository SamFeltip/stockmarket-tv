export function asset(path: string) {
    // Relative paths work in Vite and the Android HTTPS asset origin.
    return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
const logos: Record<number, string> = {
    7: "thf.png", 8: "ub.png", 9: "legal_and_general.svg", 10: "thames.png",
    11: "S_and_S.png", 12: "natwest.png",
};
export function stockLogo(key: number, path?: string) {
    return asset(path ?? `/static/imgs/stocks/${logos[key] ?? "logo.svg"}`);
}
export function portrait(path?: string) {
    return asset(path || "/static/imgs/icons/Stock.svg");
}
