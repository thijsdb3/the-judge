import { getUnselectablePlayers } from "./utils";
const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET } = process.env;
import Pusher from "pusher";

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: NEXT_PUBLIC_PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: "mt1",
});

async function triggerPusherEvent(channel, event, data) {
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
  pushPickInfo(game, newPhase);
}
import { User } from "./models";

async function pushPickInfo(game, phase) {
  const users = await User.find({
    _id: { $in: game.currentRound.unselectables.filter(Boolean) },
  }).select("username");

  const unselectables = users.map((u) => u.username);
  console.log("Unselectables usernames:", unselectables);

  const sendPickUpdate = async (playerIdOrObj, myTurn) => {
    if (!playerIdOrObj) return;

    let playerId;
    if (typeof playerIdOrObj === "string") {
      playerId = playerIdOrObj;
    } else if (playerIdOrObj._id) {
      playerId = playerIdOrObj._id.toString();
    } else {
      console.error("No valid player ID", playerIdOrObj);
      return;
    }

    let username;
    if (playerIdOrObj.username) {
      username = playerIdOrObj.username;
    } else {
      const user = await User.findById(playerId).select("username");
      username = user?.username;
    }

    if (!username) return;

    await triggerPusherEvent(
      `gameUpdate-${game.gameid}-${playerId}`,
      "pickUpdate",
      {
        myTurn,
        unselectables,
      }
    );
  };

  switch (phase) {
    case "Judge Picks Partner":
      await sendPickUpdate(game.currentRound.judge, true);
      break;

    case "Partner Picks Associate":
      await sendPickUpdate(game.currentRound.partner?.id, true);
      await sendPickUpdate(game.currentRound.judge, false);
      break;

    case "Associate Picks Paralegal":
      await sendPickUpdate(game.currentRound.associate?.id, true);
      await sendPickUpdate(game.currentRound.partner?.id, false);
      break;

    case "seeCards":
      await sendPickUpdate(game.currentRound.associate?.id, false);
      break;

    case "Peek and Discard":
    case "Judge picks investigator":
    case "Judge picks reverse investigator":
      await sendPickUpdate(game.currentRound.judge, true);
      break;
  }
}
