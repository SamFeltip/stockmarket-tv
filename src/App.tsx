import { Component, useCallback, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useConvexConnectionState } from "convex/react";
import { ConvexError } from "convex/values";
import { tv } from "./api";
import type { Board } from "./api";
import { Dashboard, Feed, JoinCard } from "./Dashboard";
import { newLobby, readRecent, remember } from "./storage";
import type { Recent } from "./storage";
import { useRemote } from "./remote";
import { demo } from "./demo";
import { asset, portrait } from "./assets";
import { PlayAnimation } from "./PlayAnimation";
import { RoundPresentation } from "./RoundPresentation";
import { resultsBoard } from "./presentation";
import { GameResults } from "./website/GameResults";
import privacy from "./privacy.json";

export function errorMessage(error: unknown) {
    return error instanceof ConvexError ? String(error.data) : error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
export class Boundary extends Component<{ children: ReactNode; onBack: () => void }, { error: string }> {
    state = { error: "" };
    static getDerivedStateFromError(error: unknown) { return { error: errorMessage(error) }; }
    render() {
        return this.state.error ? <main className="center"><h1>Unable to open this game</h1><p role="alert">{this.state.error}</p>
            <button onClick={this.props.onBack}>Back to home</button></main> : this.props.children;
    }
}

function CodeKeyboard({ onOpen, onCancel }: { onOpen: (code: string) => void; onCancel: () => void }) {
    const [code, setCode] = useState("");
    return <section className="code-entry"><span className="eyebrow">Watch any game, past or present</span><h1>Enter the lobby code</h1>
        <label htmlFor="code">Lobby code</label><input id="code" value={code} maxLength={32} placeholder="e.g. market-night" autoComplete="off" spellCheck={false}
            onChange={(event) => setCode(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}/>
        <div className="keyboard">{"abcdefghijklmnopqrstuvwxyz0123456789_-".split("").map((key) => <button key={key} disabled={code.length >= 32} onClick={() => setCode((old) => old + key)}>{key.toUpperCase()}</button>)}</div>
        <div className="actions"><button onClick={onCancel}>Cancel</button><button onClick={() => setCode((old) => old.slice(0, -1))} disabled={!code}>Delete</button>
            <button className="primary" disabled={!code} onClick={() => onOpen(code)}>Watch game →</button></div>
    </section>;
}

function DashboardScreen({ board, phoneUrl, token, onStart, busy, error, onBack, isDemo = false }: {
    board: Board; phoneUrl: string; token?: string; onStart: () => void; busy: boolean; error: string; onBack: () => void; isDemo?: boolean; onNext?: () => void;
}) {
    const { game } = board;
    const waiting = game.status === "waiting";
    const current = board.players.find((player) => player.id === game.currentPlayerId);
    const status = waiting ? "Lobby open" : game.status === "finished" ? "Game complete"
        : game.status === "playing" ? `${current?.name ?? "Next investor"}’s turn · ${Math.min(game.turn + 1, board.players.length * 3)} / ${board.players.length * 3}`
            : "Market closed · host continues on phone";
    if (waiting) return <main className="website-lobby">
        <div className="container-fluid rounded lobby-surface">
            <section className="lobby-main">
                <p>Lobby code:</p><h2 className="primary lobby-code">{game.code}</h2>
                <p>Waiting for players to join ({board.players.length} / 6)</p>
                <div className="lobby-roster" aria-label="Lobby players">
                    {board.players.map((player) => <article className="lobby-player-card" key={player.id}>
                        <div className="lobby-player-portrait"><img src={portrait(player.profileRoot)} alt={player.name}/></div>
                        <h3>{player.name}</h3>
                    </article>)}
                    {board.players.length === 0 ? <div className="empty-lobby bg-dark rounded">
                        <img src={asset("/static/imgs/icons/Handshake.svg")} alt=""/><p>Scan to join the game</p>
                    </div> : null}
                </div>
                <div className="game-length"><p>Game length</p><span className="length-value bg-dark rounded">{game.periodCount + 1} periods</span></div>
                {error ? <p className="error" role="alert">{error}</p> : null}
                <div className="lobby-actions"><button className="btn btn-secondary" onClick={onBack}>Back</button>
                    {token ? <button className="btn btn-primary" disabled={busy || board.players.length < 4} onClick={onStart}>{busy ? "Starting…" : "Launch Game"}</button> : null}</div>
                <p className="lobby-hint">{token ? "Minimum 4 players required" : "The host can launch the game on their phone."}</p>
            </section>
            <div className="lobby-join"><JoinCard code={game.code} phoneUrl={phoneUrl} waiting/>
                <p>Join on your phone. The first player to join is the host.</p></div>
            <div className="lobby-footer"><span className="website-title">Stockmarket!</span><span>{isDemo ? "Lobby preview · " : ""}↑ ↓ ← → Navigate · OK Select · Back Home</span></div>
        </div>
    </main>;
    return <div className="game-screen">
        <header className="game-header">
            <div className="card card-green spectator-heading"><img src={asset("/static/imgs/icons/Stock.svg")} alt=""/><div><h2>Spectator view</h2><p>Lobby: {game.code.toUpperCase()}</p></div></div>
            <div className="card card-green turn-heading"><h3 className="primary">{isDemo ? "Preview · " : ""}{status}</h3><p>Public portfolios and market prices</p></div>
            <div className="card card-green title-heading"><h1 id="stockmarket-header">Stockmarket!</h1><p>Period {game.currentPeriod + 1} / {game.periodCount + 1}</p></div>
        </header>
        <div className="game-layout"><Dashboard board={board} phoneUrl={phoneUrl}/><div className="sidebar">
            <Feed board={board}/>
            <div className="spectator-note"><p>Private insights stay on your phone.</p></div>
            {error ? <p className="error" role="alert">{error}</p> : null}<button className="btn btn-secondary" onClick={onBack}>Back</button>
        </div></div><footer><span>Stockmarket! · Spectator view</span><span>↑ ↓ ← → Navigate · OK Select · Back Home</span></footer>
    </div>;
}

export function GameScreen(props: Parameters<typeof DashboardScreen>[0]) {
    const { board } = props;
    const view = props.isDemo ? new URLSearchParams(location.search).get("view") : null;
    return <>
        {board.game.status === "finished" ? <main className="tv-results"><GameResults board={resultsBoard(board)} onBack={props.onBack}/></main>
            : board.reveal ? <RoundPresentation key={`${board.game.code}-${board.game.currentPeriod}`} snapshot={board}
                canAdvance={Boolean(props.token)} onNext={props.onNext ?? (() => {})} busy={props.busy} error={props.error}
                onBack={props.onBack} overview={view === "summary"}/>
                : <DashboardScreen {...props}/>}
        <PlayAnimation key={`actions-${board.game.currentPeriod}`} board={board} preview={view === "play"}/>
    </>;

}

function LiveBoard({ entry, phoneUrl, onBack }: { entry: Recent; phoneUrl: string; onBack: () => void }) {
    const board = useQuery(tv.board, { code: entry.code });
    const start = useMutation(tv.start);
    const next = useMutation(tv.next);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    if (board === undefined) return <main className="center"><h1>Loading game…</h1><button onClick={onBack}>← Home</button></main>;
    if (board === null) return <main className="center"><h1>Game not found</h1><p>Check the lobby code. This game may have been removed.</p><button onClick={onBack}>← Home</button></main>;
    return <GameScreen board={board} phoneUrl={phoneUrl} token={entry.token} busy={busy} error={error} onBack={onBack} onNext={() => {
        if (!entry.token) return;
        setBusy(true); setError("");
        void next({ code: entry.code, token: entry.token, expectedPeriod: board.game.currentPeriod })
            .catch((err: unknown) => setError(errorMessage(err))).finally(() => setBusy(false));
    }} onStart={() => {
        if (!entry.token) return;
        setBusy(true); setError("");
        void start({ code: entry.code, token: entry.token }).catch((err: unknown) => setError(errorMessage(err))).finally(() => setBusy(false));
    }}/>;
}

export function App({ phoneUrl }: { phoneUrl: string }) {
    const [entry, setEntry] = useState<Recent | null>(null);
    const [recent, setRecent] = useState(readRecent);
    const [mode, setMode] = useState("home");
    const [periods, setPeriods] = useState(6);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [draft, setDraft] = useState(newLobby);
    const connection = useConvexConnectionState();
    const create = useMutation(tv.create);
    const back = useCallback(() => { setEntry(null); setMode("home"); setError(""); }, []);
    useRemote(back, entry?.code ?? mode);
    function open(next: Recent) {
        try { setRecent(remember(next)); setEntry(next); setError(""); }
        catch { setError("Device storage is unavailable. Enable storage before creating a lobby."); }
    }
    async function createGame() {
        setBusy(true); setError("");
        try {
            // Persist the capability before the request, so a lost response can be retried safely.
            setRecent(remember(draft));
            const code = await create({ ...draft, periodCount: periods - 1 });
            open({ ...draft, code });
            setDraft(newLobby());
        } catch (err) { setError(errorMessage(err)); }
        finally { setBusy(false); }
    }
    return <>
        {!connection.isWebSocketConnected ? <div className="connection" role="status">Reconnecting… Live data may be out of date. Check the TV’s internet connection.</div> : null}
        <Boundary key={entry?.code ?? mode} onBack={back}>{entry ? <LiveBoard entry={entry} phoneUrl={phoneUrl} onBack={back}/> : <main className="home">
            <div className="home-card container rounded card card-green">
                <header className="card-header"><h1 id="stockmarket-header">Stockmarket!</h1><h2>Welcome to stockmarket</h2></header>
                {mode === "privacy" ? <>
                    <h2>{privacy.title}</h2>
                    <div className="policy-content" tabIndex={0} role="region" aria-label="Privacy policy; use Up and Down to scroll">
                        <p>Updated {privacy.updated} · Use ↑ ↓ to scroll.</p>
                        {privacy.sections.map((section) => <section key={section.heading}><h3>{section.heading}</h3><p>{section.text}</p></section>)}
                    </div>
                    <button className="btn btn-secondary" onClick={back}>Back</button>
                </> : mode === "watch" ? <CodeKeyboard onCancel={back} onOpen={(code) => open(recent.find((item) => item.code === code) ?? { code })}/> : <>
                    <div className="home-content card-body">
                        <section className="home-controls bg-dark rounded"><h2>Create a game</h2><p>Game length</p>
                            <div className="lengths" role="group" aria-label="Number of periods">{[6, 7, 8, 9, 10].map((n) => <button key={n} className="btn" aria-pressed={periods === n} onClick={() => setPeriods(n)} disabled={busy}>{n}</button>)}</div>
                            <button className="btn btn-primary create" disabled={busy || !connection.isWebSocketConnected} onClick={() => void createGame()}><img src={asset("/static/imgs/icons/Handshake.svg")} alt=""/>{busy ? "Creating game…" : "Create game"}</button>
                            {error ? <p className="error" role="alert">{error}</p> : null}
                        </section>
                        <section className="home-controls bg-dark rounded"><h2>Watch game</h2><p>Enter a lobby code to watch an existing or finished game.</p><button className="btn btn-primary" disabled={busy} onClick={() => { setMode("watch"); setError(""); }}><img src={asset("/static/imgs/icons/Stock.svg")} alt=""/>Enter lobby code</button></section>
                    </div>
                    {recent.length ? <section className="recents"><h3>Recent games</h3><div>{recent.map((item) => <button className="btn bg-dark" key={item.code} disabled={busy} onClick={() => open(item)}>{item.code.toUpperCase()}</button>)}</div></section> : null}
                    <p className="home-hint">Create a game with your remote, then scan the QR code to join on your phone.</p>
                    <div className="home-information"><p>4–6 players · Phones and internet required · Fictional money</p>
                        <button className="btn btn-secondary" onClick={() => setMode("privacy")}>Privacy &amp; support</button>
                        <button className="btn btn-secondary" onClick={() => { location.search = "?demo=1"; }}>Preview game</button></div>
                </>}
            </div><footer><span>Stockmarket! · TV</span><span>↑ ↓ ← → Navigate · OK Select</span></footer>
        </main>}</Boundary>
    </>;
}

export function DemoScreen() {
    const back = useCallback(() => { window.location.search = ""; }, []);
    useRemote(back, "demo");
    const preview = new URLSearchParams(location.search).get("view");
    const [phase, setPhase] = useState(0);
    const sample = preview === "finished" ? { ...demo, game: { ...demo.game, status: "finished" as const } } : preview === "lobby" ? { ...demo, game: { ...demo.game, status: "waiting" as const }, players: demo.players.slice(0, 4) }
        : preview === "reveal" || preview === "summary" || preview === "flow" ? { ...demo, game: { ...demo.game, status: "closed" as const },
            reveal: { period: demo.game.currentPeriod, prices: demo.stocks.map((stock) => ({ stockKey: stock.key, value: stock.value })), suspended: [],
                stocks: demo.stocks.map((stock) => ({ key: stock.key, name: stock.name, display: true,
                    imagePath: `/static/imgs/stocks/${["thf.png", "ub.png", "legal_and_general.svg", "thames.png", "S_and_S.png", "natwest.png"][stock.key - 7]}`,
                    secondaryImagePath: `/static/imgs/stocks/${["thf.png", "ub.png", "legal_and_general.svg", "thames.png", "S_and_S.png", "natwest.png"][stock.key - 7]}` })),
                insights: demo.stocks.flatMap((stock, i) => [0, 1].map((n) => ({ _id: `${i}-${n}`, playerId: String(n + 1), stockKey: stock.key,
                    value: n ? -.25 : .5, description: `${stock.name} Insight ${n ? "-0.25" : "+0.5"}`, resolved: false }))) } } : demo;
    const shown = phase ? { ...sample, reveal: null, game: { ...sample.game, status: "playing" as const, currentPeriod: demo.game.currentPeriod + phase } } : sample;
    return <><GameScreen board={shown} phoneUrl="https://stockmarket.samfelton.com" token={["lobby", "reveal", "summary", "flow"].includes(preview ?? "") ? "preview" : undefined}
        busy={false} error="" onStart={() => {}} onNext={() => setPhase((old) => old + 1)} onBack={back} isDemo/>
        {preview === "flow" && phase === 0 && <button className="demo-next-period" onClick={() => setPhase(1)}>Preview: start next period</button>}
    </>;
}
