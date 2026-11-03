import { useState } from "react";
import { asset } from "../assets";
export const money = (value: number) => value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
export function Change({ value }: { value: number }) {
    const tone = value > 0 ? "success" : value < 0 ? "danger" : "secondary";
    return <div className={`total-insight text-${tone} d-flex flex-row align-items-center`}>
        {value === 0 ? <p>boring!</p> : <><img className="pe-2" src={asset(`/static/imgs/icons/stock_${value > 0 ? "up" : "down"}.svg`)} alt="stock movement"/><span>£{value.toFixed(2)}</span></>}
    </div>;
}

export function useAction() {
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    async function run(action: () => Promise<unknown>) {
        setBusy(true); setError("");
        try { await action(); return true; }
        catch (error) { setError(error instanceof Error ? error.message : "Unable to continue"); return false; }
        finally { setBusy(false); }
    }
    return { error, busy, run };
}
