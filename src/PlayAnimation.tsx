import { RolePortrait } from "./website/RolePortrait";
import { useEffect, useState } from "react";
import type { Board } from "./api";
import { portrait, stockLogo } from "./assets";
import { FeedMessage } from "./website/FeedMessage";
import { actionAnimationMs } from "./website/timing";
import { newPlayEvents } from "./presentation";

export function PlayAnimation({ board, preview = false }: { board: Board; preview?: boolean }) {
    const newest = board.feed[0];
    const [state, setState] = useState(() => ({ id: newest?.id, at: newest?.at ?? -Infinity,
        queue: preview && newest ? [newest] : [] as Board["feed"] }));
    if (newest?.id !== state.id) {
        setState({ id: newest?.id, at: newest?.at ?? -Infinity,
            queue: [...state.queue, ...newPlayEvents(board, state.id, state.at)] });
    }
    const active = state.queue[0];
    const activeId = active?.id;
    useEffect(() => {
        if (!activeId) return;
        const timer = window.setTimeout(() => setState((old) => old.queue[0]?.id === activeId
            ? { ...old, queue: old.queue.slice(1) } : old), actionAnimationMs);
        return () => window.clearTimeout(timer);
    }, [activeId]);
    if (!active) return null;
    const player = board.players.find((candidate) => candidate.name === active.title);
    return <div key={active.id} id="play-notif" className="play-notification d-flex justify-content-center align-items-center" role="status" aria-live="polite">
        <div className="d-flex flex-column align-items-center text-center gap-3">
            <RolePortrait name={active.title} profileRoot={portrait(active.imageRoot || player?.profileRoot)} role={active.roleAfter}/>
            <h1>{active.title}</h1>
            <FeedMessage item={active} stocks={board.stocks.map((stock) => ({ ...stock, display: true,
                imagePath: stockLogo(stock.key, stock.imagePath), secondaryImagePath: stockLogo(stock.key, stock.imagePath) }))} detailed/>
        </div>
        <button type="button" className="play-notification-dismiss" aria-label="Dismiss play notification"
            onClick={() => setState((old) => old.queue[0]?.id === activeId
                ? { ...old, queue: old.queue.slice(1) } : old)}/>
    </div>;
}
