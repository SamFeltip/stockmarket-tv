import { useEffect, useState } from "react";
import type { Board } from "./api";
import { websiteBoard } from "./presentation";
import { revealStocks } from "./website/reveals";
import { roundProgress } from "./website/round-preview";
import { RoundReveal } from "./website/RoundReveal";
import { RoundOverview } from "./website/RoundOverview";
import { RoundWealth } from "./website/RoundWealth";

export function RoundPresentation({ snapshot, advanced, onContinue, onBack, overview = false }: {
    snapshot: Board; advanced: boolean; onContinue: () => void; onBack: () => void; overview?: boolean;
}) {
    const board = websiteBoard(snapshot);
    const groups = revealStocks(board.stocks, board.insights);
    const [step, setStep] = useState(overview ? groups.length : 0);
    const [index, setIndex] = useState(0);
    const stock = groups[step];
    const visible = board.insights.filter((insight) => insight.stockKey === stock?.key);
    const unresolved = stock?.name === "Hold Stock Price" ? visible.find((insight) => !insight.resolved) : undefined;
    const owner = board.players.find((player) => player._id === unresolved?.playerId);
    const reviewed = step >= groups.length;
    const { preview, wealth } = roundProgress(board, step, index);
    useEffect(() => {
        if (unresolved || index >= visible.length || reviewed) return;
        const timer = window.setTimeout(() => setIndex((current) => current + 1), 2500);
        return () => window.clearTimeout(timer);
    }, [index, visible.length, unresolved, step, reviewed]);
    return <main className="website-presentation">
        <div className="round-end gap-3 p-4 d-grid">
            <div className="d-flex flex-column align-items-center justify-content-center">
                <h1>End of round</h1>{stock && !stock.display && <h2>Additional insights</h2>}
            </div>
            {reviewed ? <RoundOverview before={board} after={preview}/> : <>
                <div id="insight-view" className="card card-green p-4 rounded border border-5 border-white">
                    {unresolved ? <div className="bg-white text-black rounded p-4">
                        <h2 className="text-black">Waiting for {owner?.name ?? "the player"} to suspend a share</h2>
                        <div className="d-grid gap-2 hold-stock-options">
                            {board.stocks.filter((item) => item.display).map((item) => <div className="btn btn-outline-secondary" key={item.key}>
                                <img src={item.imagePath} alt={item.name}/><p>£{board.game.prices.find((price) => price.stockKey === item.key)?.value.toFixed(2)}</p>
                            </div>)}
                        </div><p className="mt-3">They choose on their phone.</p>
                    </div> : stock ? <RoundReveal board={board} preview={preview} stock={stock} insights={visible} index={index}/> : null}
                </div>
                <div id="stock-view" className="card card-green px-5 py-4 rounded border-5 border-white flex-sm-row align-items-center">
                    <h2>Stock Values:</h2><div className="gap-3 flex-fill d-flex flex-nowrap flex-column flex-sm-row justify-content-between align-items-center">
                        {board.stocks.filter((item) => item.display).map((item) => <div className="game-stock d-flex flex-column align-items-center" key={item.key}>
                            <img className="w-100 p-3 object-fit-contain" src={item.secondaryImagePath} alt={item.name}/>
                            <div>£{(preview.game.prices.find((price) => price.stockKey === item.key)?.value ?? 0).toFixed(2)}</div>
                        </div>)}
                    </div>
                </div><RoundWealth players={wealth.players}/>
            </>}
            <div id="next-step-wrapper" className="round-navigation p-3 d-flex gap-3 align-items-center" style={{animation:"none"}}>
                <button className="btn btn-secondary" onClick={onBack}>Back</button>
                {reviewed ? advanced ? <button className="btn btn-primary" onClick={onContinue}>Continue to game →</button>
                    : <p>Waiting for the game creator to continue.</p>
                    : <button className="btn btn-primary" disabled={Boolean(unresolved)} onClick={() => {
                        if (index < visible.length) setIndex(visible.length);
                        else { setStep((old) => old + 1); setIndex(0); }
                    }}>{index < visible.length ? "Skip to stock summary" : step < groups.length - 1 ? `Next: ${groups[step + 1].name}` : "View round summary"} →</button>}
            </div>
        </div>
    </main>;
}
