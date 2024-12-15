import { transitionPhase, clearRound } from "./gameround";
import { triggerPusherEvent,updateGameUI } from "./pusher";
import { setPlayerTurn } from "./gameround";
import { NextResponse } from "next/server";
export const judgePicksInvestigator = async (par) => {
  if (
    par.playerClickingId.equals(par.judge) &&
    par.game.playerInvestigating == null
  ) {
    par.game.playerInvestigating = par.selectedPlayerId;
    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to investigate`
    );
    par.game.banner = `${par.selectedPlayerUsername} is choosing who they want to investigate`;
    par.game.unpickablePlayers = [];

    await updateGameUI(par.game, par.lobbyid);
    await setPlayerTurn(par.game, par.selectedPlayerId, par.playerClickingId);
    par.game.currentRound.phase = "investigation";
  }
};

export const judgePicksReverseInvestigator = async (par) => {
  if (
    par.playerClickingId.equals(par.judge) &&
    par.game.playerReverseInvestigating == null
  ) {
    par.game.playerReverseInvestigating = par.selectedPlayerId;
    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to reverse investigate`
    );

    par.game.banner = `${par.selectedPlayerUsername} is choosing who they want to reverse investigate`;
    par.game.unpickablePlayers = [];
    await updateGameUI(par.game, par.lobbyid);
    await setPlayerTurn(par.game, par.selectedPlayerId, par.playerClickingId);
    par.game.currentRound.phase = "reverse investigation";
  }
};

export const handleInvestigation = async (par) => {
  if (
    par.playerClickingId.equals(par.game.playerInvestigating) &&
    par.game.playerBeingInvestigated == null
  ) {
    par.game.playerBeingInvestigated = par.selectedPlayerId;
    const playerClicking = par.game.players.find((p) =>
      p.player._id.equals(par.playerClickingId)
    );
    const playerBeingClicked = par.game.players.find((p) =>
      p.player._id.equals(par.selectedPlayerId)
    );

    if (playerClicking && playerBeingClicked) {
      par.game.gameChat.push(
        `${par.playerClickingUsername} chose to see ${par.selectedPlayerUsername}'s role`
      );

      await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "gamechat", {
        gamechat: par.game.gameChat,
      });
      await triggerPusherEvent(
        `gameUpdate-${par.lobbyid}-${par.playerClickingId}`,
        "investigation",
        {
          playerInvestigating: par.playerClickingUsername,
          playerBeingInvestigated: par.selectedPlayerUsername,
        }
      );

      par.game.players.forEach((p) => {
        if (p.player._id.equals(par.playerClickingId)) {
          p.isOnTurn = false;
        }
        if (p.player._id.equals(par.judge)) {
          p.isOnTurn = true;
        }
      });
      triggerPusherEvent(`gameUpdate-${par.lobbyid}-${par.judge}`, "myTurn", {
        turn: true,
      });

      triggerPusherEvent(
        `gameUpdate-${par.lobbyid}-${par.playerClickingId}`,
        "myTurn",
        { turn: false }
      );
    } else {
      console.error("Player data could not be found for investigation.");
    }
  }
  await clearRound(par.game);
  await transitionPhase(par.game, "Judge Picks Partner");
  return NextResponse.json({ message: "Investigation completed" });
};

export const handleReverseInvestigation = async (par) => {
  if (
    par.playerClickingId.equals(par.game.playerReverseInvestigating) &&
    par.game.playerBeingReverseInvestigated == null
  ) {
    par.game.playerBeingReverseInvestigated = par.selectedPlayerId;
    const playerClicking = par.game.players.find((p) =>
      p.player._id.equals(par.playerClickingId)
    );
    const playerBeingClicked = par.game.players.find((p) =>
      p.player._id.equals(par.selectedPlayerId)
    );

    if (playerClicking && playerBeingClicked) {
      par.game.gameChat.push(
        `${par.playerClickingUsername} chose to show ${par.selectedPlayerUsername} their role`
      );

      await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "gamechat", {
        gamechat: par.game.gameChat,
      });
      await triggerPusherEvent(
        `gameUpdate-${par.lobbyid}-${par.selectedPlayerId}`,
        "reverse investigation",
        {
          playerReverseInvestigating: par.playerClickingUsername,
          playerBeingReverseInvestigated: par.selectedPlayerUsername,
        }
      );
      par.game.players.forEach((player) => {
        if (player.player._id.equals(par.playerClickingId)) {
          player.isOnTurn = false;
        }
        if (player.player._id.equals(par.judge)) {
          player.isOnTurn = true;
        }
      });
      triggerPusherEvent(`gameUpdate-${par.lobbyid}-${par.judge}`, "myTurn", {
        turn: true,
      });
      triggerPusherEvent(
        `gameUpdate-${par.lobbyid}-${par.playerClickingId}`,
        "myTurn",
        { turn: false }
      );
    } else {
      console.error(
        "Player data could not be found for reverse investigation."
      );
    }
  }
  await clearRound(par.game);
  await transitionPhase(par.game, "Judge Picks Partner");
  return NextResponse.json({ message: "Reverse Investigation completed" });
};

export const handlePeekAndDiscardPick = async (par) => {
  if (
    par.playerClickingId.equals(par.judge) &&
    par.game.playerPeeking.id == null
  ) {
    par.game.playerPeeking = { id: par.selectedPlayerId, cards: [] };
    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to peek at cards and discard`
    );

    await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "gamechat", {
      gamechat: par.game.gameChat,
    });
    par.game.playerPeeking.cards = par.game.drawPile.splice(0, 2);
    par.game.banner = `${par.selectedPlayerUsername} is choosing if they want to discard a card`;
   
     await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "banner", {
      banner: par.game.banner,
    });
    await triggerPusherEvent(
      `gameUpdate-${par.lobbyid}-${par.selectedPlayerId}`,
      "peekAndDiscardPhaseStarted",
      { cards: par.game.playerPeeking.cards }
    );
    await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "updateDeckCount", {
      cardsLeft: par.game.drawPile.length,
    });
  }
};

export const handlePeekAndDiscard = async (
  game,
  discardOption,
  card,
  lobbyid
) => {
  const peekedCards = game.playerPeeking.cards;

  if (discardOption === "discardOne" && card) {
    const remainingCards = peekedCards.filter(
      (c, i) => i !== peekedCards.indexOf(card)
    );
    game.drawPile.unshift(...remainingCards);
    game.discardPile.push(card);
  } else if (discardOption === "discardNone") {
    game.drawPile.unshift(...peekedCards);
  }

  await triggerPusherEvent(`gameUpdate-${lobbyid}`, "updateDeckCount", {
    cardsLeft: game.drawPile.length,
  });
  const judge = await game.players.find((p) => p.role == "Judge");
  judge.isOnTurn = true;

  await clearRound(game);
  await transitionPhase(game, "Judge Picks Partner");
  return NextResponse.json({ message: "Peek and Discard completed" });
};
