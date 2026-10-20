import { asset } from "../assets";
export const money = (value: number) => value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
export function Change({ value }: { value: number }) {
    const tone = value > 0 ? "success" : value < 0 ? "danger" : "secondary";
    return <div className={`total-insight text-${tone} d-flex flex-row align-items-center`}>
        {value === 0 ? <p>boring!</p> : <><img className="pe-2" src={asset(`/static/imgs/icons/stock_${value > 0 ? "up" : "down"}.svg`)} alt="stock movement"/><span>£{value.toFixed(2)}</span></>}
    </div>;
}
