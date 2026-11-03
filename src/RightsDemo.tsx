import { useState } from "react";
import { demo } from "./demo";
import { resultsBoard } from "./presentation";
import { RightsIssue } from "./website/RightsIssue";
import { rightsIssueOrder, rightsEntitlement } from "./website/rights-issue";
import type { Board } from "./api";

const actor = demo.players[0].id;
const key = 8;
const initial: Board = { ...demo, game: { ...demo.game, rightsIssue: {
    insightId: "rights-demo", stockKey: key, actorPlayerId: actor, period: demo.game.currentPeriod,
    turn: demo.game.turn, index: 0,
    offers: rightsIssueOrder(demo.players.map(player=>({...player,_id:player.id})),actor).flatMap(player=>{
        const held=player.holdings.find(holding=>holding.stockKey===key)?.quantity??0;
        return held>0?[{playerId:player.id,held,maximum:rightsEntitlement(held)}]:[];
    }),
} } };
export function RightsDemo({onBack}:{onBack:()=>void}) {
    const [board,setBoard]=useState(initial);
    return <RightsIssue board={resultsBoard(board)} spectator onDecision={async()=>{
        const issue=board.game.rightsIssue!;
        if(issue.index+1===issue.offers.length) { onBack(); return; }
        setBoard({...board,game:{...board.game,rightsIssue:{...issue,index:issue.index+1}}});
    }}/>;
}
