import { User } from "@/lib/models";
import { triggerPusherEvent } from "@/lib/phaseTransition";

export async function sendPickUpdate({
  gameId,
  playerId,
  myTurn,
  unselectableIds,
}: {
  gameId: string,
  playerId: string,
  myTurn: boolean,
  unselectableIds: string[],
}) {
  const users = await User.find({ _id: { $in: unselectableIds } }).select(
    "username"
  );

  const unselectables = users.map((u) => u.username);

  return triggerPusherEvent(`gameUpdate-${gameId}-${playerId}`, "pickUpdate", {
    myTurn,
    unselectables,
  });
}
