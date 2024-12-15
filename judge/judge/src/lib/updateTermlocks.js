import { triggerPusherEvent } from "./pusher";
import { fetchUsername } from "./utils";

export const UpdateTermlocks = async (game, playerCount) => {
  if (playerCount < 8) return;
  if (!game.previousTeam) return;

  const { previousTeam, currentRound } = game;
  const previousTeamIds = [
    previousTeam.partner,
    previousTeam.associate,
    previousTeam.paralegal,
  ];

  console.log("this line is before error");

  // Fetch usernames using the fetchUsername function
  const previousTeamUsernames = await Promise.all(
    previousTeamIds.map(async (playerId) => {
      const username = await fetchUsername(playerId);
      return username;
    })
  );

  console.log("these are the previous usernames", previousTeamUsernames);
  console.log("this line is before error 3");

  const isInPreviousTeam = (playerId) =>
    previousTeamIds.includes(playerId?.toString());

  let shouldAddUsernames = false;
  console.log("this line is before error 4");

  if (playerCount >= 12) {
    shouldAddUsernames = true;
  } else if (playerCount >= 10) {
    shouldAddUsernames =
      isInPreviousTeam(currentRound.partner?.id) ||
      isInPreviousTeam(currentRound.associate?.id);
  } else {
    shouldAddUsernames =
      isInPreviousTeam(currentRound.partner?.id) &&
      isInPreviousTeam(currentRound.associate?.id);
  }

  if (shouldAddUsernames) {
    console.log("the added players", previousTeamUsernames);
    game.unpickablePlayers = Array.from(
      new Set([...game.unpickablePlayers, ...previousTeamUsernames])
    );
  }

  await triggerPusherEvent(`gameUpdate-${game.gameid}`, "termlockUpdate", {
    termlocks: game.unpickablePlayers,
  });

  try {
    await game.save();
  } catch (error) {
    console.error("Error saving game:", error);
    throw new Error("Failed to update game termlocks.");
  }
};
