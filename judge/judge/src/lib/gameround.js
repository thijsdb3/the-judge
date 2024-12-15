import { triggerPusherEvent } from "./pusher";
import { fetchUsername, reshuffleDeck } from "./utils";
import { UpdateTermlocks } from "./updateTermlocks";

export const handlePick = async (selectedPlayer, lobbyid, playerClicking) => {
  try {
    const res = await fetch("/api/game/gameround/pick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lobbyid, selectedPlayer, playerClicking }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(``, data);
    } else {
      console.error("Failed to pick player");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

export const transitionPhase = async (game, newPhase) => {
  game.currentRound.phase = newPhase;
  await game.save();
};

export const clearRound = async (game) => {
  if (game.currentRound.partner.id) {
    game.previousTeam.partner = game.currentRound.partner.id;
  }

  if (game.currentRound.associate.id) {
    game.previousTeam.associate = game.currentRound.associate.id;
  }

  if (game.currentRound.paralegal.id) {
    game.previousTeam.paralegal = game.currentRound.paralegal.id;
  }
  const termlockedPlayer = await fetchUsername(game.currentRound.partner.id);

  game.currentRound.partner.id = null;
  game.currentRound.associate.id = null;
  game.currentRound.paralegal.id = null;
  game.currentRound.partner.cards = null;
  game.currentRound.associate.cards = null;
  game.currentRound.paralegal.cards = null;
  console.log("this is the type of termlockedPlayer", termlockedPlayer);
  game.unpickablePlayers = [termlockedPlayer];
  game.banner = `The Judge should select a Partner`;
  await triggerPusherEvent(`gameUpdate-${game.gameid}`, "banner", {
    banner: game.banner,
  });

  await triggerPusherEvent(`gameUpdate-${game.gameid}`, "termlockUpdate", {
    termlocks: game.unpickablePlayers,
  });
  await game.save();
  await UpdateTermlocks(game, game.players.length);
};

export const setPlayerTurn = async (
  game,
  nextPlayerOnTurn,
  prevPlayerOnTurn
) => {
  const nextPlayerOnTurnIndex = game.players.findIndex((player) =>
    player.player.equals(nextPlayerOnTurn)
  );
  if (nextPlayerOnTurnIndex !== -1) {
    game.players[nextPlayerOnTurnIndex].isOnTurn = true;
    triggerPusherEvent(
      `gameUpdate-${game.gameid}-${nextPlayerOnTurn}`,
      "myTurn",
      { turn: true }
    );
  }

  const prevPlayerOnTurnIndex = game.players.findIndex((player) =>
    player.player.equals(prevPlayerOnTurn)
  );
  if (prevPlayerOnTurnIndex !== -1) {
    game.players[prevPlayerOnTurnIndex].isOnTurn = false;
    triggerPusherEvent(
      `gameUpdate-${game.gameid}-${prevPlayerOnTurn}`,
      "myTurn",
      { turn: false }
    );
  }
};

export async function setUpForCardPhase(par) {
  if (par.game.drawPile.length >= 6) {
    par.game.currentRound.associate.cards = par.game.drawPile.slice(0, 3);
    par.game.currentRound.paralegal.cards = par.game.drawPile.slice(3, 6);
    par.game.drawPile.splice(0, 6);
  } else if (par.game.drawPile.length >= 3) {
    par.game.currentRound.associate.cards = par.game.drawPile.slice(0, 3);
    par.game.drawPile = reshuffleDeck(par.game);
    par.game.currentRound.paralegal.cards = par.game.drawPile.slice(0, 3);
    par.game.drawPile.splice(0, 3);
  } else {
    par.game.drawPile = reshuffleDeck(par.game);
    par.game.currentRound.associate.cards = par.game.drawPile.slice(0, 3);
    par.game.currentRound.paralegal.cards = par.game.drawPile.slice(3, 6);
    par.game.drawPile.splice(0, 6);
  }
  par.game.currentRound.phase = "seeCards";

  await Promise.all([
    triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "updateDeckCount", {
      cardsLeft: par.game.drawPile.length,
    }),
    triggerPusherEvent(
      `gameUpdate-${par.lobbyid}-${par.game.currentRound.associate.id}`,
      "cardPhaseStarted",
      {}
    ),
    triggerPusherEvent(
      `gameUpdate-${par.lobbyid}-${par.game.currentRound.paralegal.id}`,
      "cardPhaseStarted",
      {}
    ),
  ]);
}
