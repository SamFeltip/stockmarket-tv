import { useEffect, useState } from "react";
import type { Board } from "./api";
import { portrait, stockLogo } from "./assets";
import { FeedMessage } from "./website/FeedMessage";
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
    useEffect(() => {
        if (!active) return;
        const timer = window.setTimeout(() => setState((old) => ({ ...old, queue: old.queue.slice(1) })), 3500);
        return () => window.clearTimeout(timer);
    }, [active]);
    if (!active) return null;
    const player = board.players.find((candidate) => candidate.name === active.title);
    return <div key={active.id} id="play-notif" className="play-notification d-flex justify-content-center align-items-center" role="status" aria-live="polite">
        <div className="d-flex flex-column align-items-center text-center gap-3">
            <img className="rounded" src={portrait(active.imageRoot || player?.profileRoot)} alt={active.title}/>
            <h1>{active.title}</h1>
            <FeedMessage item={active} stocks={board.stocks.map((stock) => ({ ...stock, display: true,
                imagePath: stockLogo(stock.key, stock.imagePath), secondaryImagePath: stockLogo(stock.key, stock.imagePath) }))} detailed/>
        </div>
    </div>;
}
