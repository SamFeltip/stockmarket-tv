import { useMutation } from "convex/react";
import { rounds } from "./api";
import { RoundPresentation } from "./website/SpectatorRoundPresentation";

export { RoundPresentation };

export function ConnectedRoundPresentation(props: Parameters<typeof RoundPresentation>[0]) {
    const begin = useMutation(rounds.beginSuspensions);
    const skip = useMutation(rounds.skipSuspension);
    const move = useMutation(rounds.moveReveal);
    return <RoundPresentation {...props} onBeginSuspensions={begin} onSkipSuspension={skip} onMoveReveal={move}/>;
}
