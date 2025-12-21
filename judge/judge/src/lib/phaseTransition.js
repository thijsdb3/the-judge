import { getUnselectablePlayers } from "./utils";
const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET } = process.env;
import Pusher from "pusher";
import { sendPickUpdate } from "@/lib/pickUpdate";

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: NEXT_PUBLIC_PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: "mt1",
});
export async function triggerPusherEvent(channel, event, data) {
  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error(
      `Error triggering Pusher event: ${event} on ${channel}`,
      error
    );
  }
}

export async function transitionPhase(game, newPhase) {
  game.currentRound.phase = newPhase;
  game.currentRound.unselectables = getUnselectablePlayers(
    game,
    game.playercount,
    newPhase
  );

  await pushPickInfo(game, newPhase);
}

async function pushPickInfo(game, phase) {
  const unselectableIds = game.currentRound.unselectables
    .filter(Boolean)
    .map((id) => id.toString());

  const send = (playerId, myTurn) =>
    playerId &&
    sendPickUpdate({
      gameId: game.gameid,
      playerId: playerId.toString(),
      myTurn,
      unselectableIds,
    });

  switch (phase) {
    case "Judge Picks Partner":
      await send(game.currentRound.judge, true);
      break;

    case "Partner Picks Associate":
      await send(game.currentRound.partner?.id, true);
      await send(game.currentRound.judge, false);
      break;

    case "Associate Picks Paralegal":
      await send(game.currentRound.associate?.id, true);
      await send(game.currentRound.partner?.id, false);
      break;

    case "seeCards":
      await send(game.currentRound.associate?.id, false);
      break;

    case "Peek and Discard":
    case "Choose Peeking Player":
    case "Judge picks investigator":
    case "Judge picks reverse investigator":
      await send(game.currentRound.judge, true);
      break;
  }
}
