import { useMutation } from "convex/react";
import { rightsIssue, type Board } from "./api";
import { resultsBoard } from "./presentation";
import { RightsIssue } from "./website/RightsIssue";

export function RightsIssueScreen({ board }: { board: Board }) {
    const skip = useMutation(rightsIssue.skip);
    const issue = board.game.rightsIssue!;
    return <RightsIssue board={resultsBoard(board)} spectator onDecision={() => skip({
        code: board.game.code, insightId: issue.insightId, expectedIndex: issue.index,
    })}/>;
}
