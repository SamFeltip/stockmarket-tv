import { useEffect } from "react";

export type Box = { left: number; top: number; width: number; height: number };
export function directionalTarget(boxes: Box[], current: number, key: string) {
    const source = boxes[current];
    if (!source) return 0;
    const horizontal = key === "ArrowLeft" || key === "ArrowRight";
    const sign = key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;
    const x = source.left + source.width / 2;
    const y = source.top + source.height / 2;
    let best = current;
    let score = Infinity;
    boxes.forEach((box, index) => {
        if (index === current) return;
        const dx = box.left + box.width / 2 - x;
        const dy = box.top + box.height / 2 - y;
        const forward = (horizontal ? dx : dy) * sign;
        const sideways = Math.abs(horizontal ? dy : dx);
        if (forward < 1) return;
        const candidate = forward + sideways * 3;
        if (candidate < score) { score = candidate; best = index; }
    });
    return best;
}

export function useRemote(onBack: () => void, screen: string) {
    useEffect(() => {
        document.documentElement.dataset.tvScreen = screen;
        const selector = "button:not(:disabled), input:not(:disabled), [tabindex='0']";
        const visible = () => [...document.querySelectorAll<HTMLElement>(selector)]
            .filter((el) => el.getBoundingClientRect().width > 0 && !el.closest("[inert]"));
        const focus = () => {
            if (!visible().includes(document.activeElement as HTMLElement)) visible()[0]?.focus();
        };
        const frame = requestAnimationFrame(focus);
        const observer = new MutationObserver(focus);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape" || event.key === "BrowserBack") {
                event.preventDefault(); onBack(); return;
            }
            if (!event.key.startsWith("Arrow")) return;
            const history = (document.activeElement as Element | null)?.closest<HTMLElement>(".history-viewport");
            if (history && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
                event.preventDefault();
                history.scrollBy({ left: history.clientWidth * (event.key === "ArrowRight" ? .4 : -.4) });
                return;
            }
            // Text fields accept normal typing; D-pad can still leave them in any direction.
            const elements = visible();
            const current = elements.indexOf(document.activeElement as HTMLElement);
            const index = directionalTarget(elements.map((el) => el.getBoundingClientRect()), current, event.key);
            event.preventDefault(); elements[index]?.focus();
            elements[index]?.scrollIntoView({ block: "nearest", inline: "nearest" });
        };
        document.addEventListener("keydown", handler);
        return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener("keydown", handler); };
    }, [onBack, screen]);
}
