import { useState } from "react";
import type { Board } from "./api";
import { demo } from "./demo";
import { websiteBoard } from "./presentation";
import { ShareSuspended } from "./website/ShareSuspended";
import { RoundOverview } from "./website/RoundOverview";
import { previewRound } from "./website/round-preview";
import { pendingSuspensions } from "./website/suspensions";

const snapshot: Board = { ...demo, game: { ...demo.game, status: "closed", currentPeriod: 1 }, feed: [],
    reveal: { period: 1, suspensionPeriod: 1, suspended: [],
        prices: demo.stocks.map(stock=>({stockKey:stock.key,value:stock.value})),
        stocks: demo.stocks.map((stock,index)=>({...stock,display:true,variation:index,
            imagePath:`/static/imgs/stocks/${["thf.png","ub.png","legal_and_general.svg","thames.png","S_and_S.png","natwest.png"][index]}`,
            secondaryImagePath:"/static/imgs/logo.svg"})),
        insights:[
            {_id:"suspend-1",playerId:demo.players[1].id,stockKey:-2,value:0,period:1,chanceKind:"hold",description:"Share Suspended",resolved:false},
            {_id:"suspend-2",playerId:demo.players[0].id,stockKey:-2,value:0,period:1,chanceKind:"hold",description:"Share Suspended",resolved:false},
            {_id:"move-1",playerId:demo.players[1].id,stockKey:8,value:-1,period:1,description:"Market downturn",resolved:false},
        ] },
};

export function SuspensionDemo({onBack}:{onBack:()=>void}) {
    const [current,setCurrent] = useState(snapshot);
    const board=websiteBoard(current);
    const card=pendingSuspensions(1,board.players,board.insights)[0];
    return <main className="website-presentation"><div className="round-end suspension-round p-4">
        {card ? <ShareSuspended key={card._id} board={board} card={card} spectator onDecision={async()=>{
            setCurrent(old=>({...old,reveal:{...old.reveal!,insights:old.reveal!.insights.map(item=>item._id===card._id?{...item,used:true,resolved:true}:item)}}));
            return true;
        }}/> : <>
            <RoundOverview before={board} after={previewRound(board,board.insights,board.stocks.map(stock=>stock.key))}/>
            <button className="btn btn-secondary" onClick={onBack}>Back</button>
        </>}
    </div></main>;
}
