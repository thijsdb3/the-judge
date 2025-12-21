import { resetRoundAndTransition } from "./roundUtils";
import { pushGameChat } from "./utils";
import { NextResponse } from "next/server";
import { transitionPhase, triggerPusherEvent } from "./phaseTransition";

function getCurrentRoundPlayers(game) {
  const getById = (id) => game.players.find((p) => p.player._id.equals(id));
  return {
    partner: getById(game.currentRound.partner.id),
    associate: getById(game.currentRound.associate.id),
    paralegal: getById(game.currentRound.paralegal.id),
  };
}

async function handleVetoGeneric(game, lobbyid, teamType, nextPhase, messages) {
  const players = getCurrentRoundPlayers(game);
  const allMatch = Object.values(players).every((p) => p.role === teamType);
  if (!allMatch) return false;

  for (const msg of messages) {
    await pushGameChat(game, lobbyid, msg);
  }

  if (nextPhase === "game ended") {
    await transitionPhase(game, nextPhase);
  } else {
    await resetRoundAndTransition(game, nextPhase);
  }
  return true;
}

async function handleInvestigationGeneric(par, options) {
  const { roleField, beingField, eventKey, chatMsg, nextPhase } = options;

  if (
    par.playerClickingId.equals(par.game[roleField]) &&
    par.game[beingField] == null
  ) {
    par.game[beingField] = par.selectedPlayerId;

    const playerClicking = par.game.players.find((p) =>
      p.player._id.equals(par.playerClickingId)
    );
    const playerBeingClicked = par.game.players.find((p) =>
      p.player._id.equals(par.selectedPlayerId)
    );

    if (playerClicking && playerBeingClicked) {
      await pushGameChat(
        par.game,
        par.lobbyid,
        chatMsg(playerClicking, playerBeingClicked)
      );

      await triggerPusherEvent(
        `gameUpdate-${par.lobbyid}-${par.selectedPlayerId}`,
        eventKey,
        {
          [roleField]: playerClicking.player.username,
          [beingField]: playerBeingClicked.player.username,
        }
      );
    } else {
      console.error("Player data could not be found for investigation.");
    }

    transitionPhase(par.game, nextPhase);
  }
}

/* ---------------- Special Powers Logic ---------------- */

export async function handleSpecialPowers(game, isBlue) {
  const reds = game.boardState.reds;
  const blues = game.boardState.blues;
  const playerCount = game.players.length;

  if (!isBlue && reds === 2) {
    await resetRoundAndTransition(game, "Choose Peeking Player");
    return true;
  }

  if (!isBlue && reds === 3 && playerCount >= 7) {
    await resetRoundAndTransition(game, "Judge picks investigator");
    return true;
  }

  if (!isBlue && reds === 4) {
    game.HonestVetoEnabled = true;
    if (playerCount >= 9) {
      await resetRoundAndTransition(game, "Judge picks reverse investigator");
      return true;
    }
  }

  if (isBlue && blues === 4 && reds === 4) {
    game.CorruptVetoEnabled = true;
  }

  return false;
}

export async function handlePeekAndDiscard(par) {
  if (
    !par.playerClickingId.equals(par.game.currentRound.judge) ||
    par.game.currentRound.playerPeeking?.id != null
  ) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  par.game.currentRound.playerPeeking = {
    id: par.selectedPlayerId,
    cards: par.game.drawPile.splice(0, 2),
  };

  await pushGameChat(
    par.game,
    par.lobbyid,
    `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to peek at cards and discard`
  );

  await triggerPusherEvent(
    `gameUpdate-${par.lobbyid}-${par.selectedPlayerId}`,
    "peekAndDiscardPhaseStarted",
    { cards: par.game.currentRound.playerPeeking.cards }
  );

  await triggerPusherEvent(`gameUpdate-${par.game.gameid}`, "updateDeckCount", {
    cardsLeft: par.game.drawPile.length,
  });

  transitionPhase(par.game, "Peek and Discard");
  await par.game.save();
  return NextResponse.json({ success: true });
}
export async function handlePeekDecision(game, discardOption, card, lobbyid) {
  const playerPeeking = game.currentRound.playerPeeking;

  const [cardA, cardB] = playerPeeking.cards;
  const player = game.players.find(
    (p) => p.player.toString() === playerPeeking.id.toString()
  );

  const username = player?.player.username;
  if (discardOption === "discardOne") {
    if (!card || !playerPeeking.cards.includes(card)) {
      return NextResponse.json({ error: "Invalid card" }, { status: 400 });
    }

    const keptCard = card === cardA ? cardB : cardA;

    game.discardPile.push(card);
    // unshift puts at begining
    game.drawPile.unshift(keptCard);

    await pushGameChat(
      game,
      lobbyid,
      `${username} peeked at two cards and discarded one`
    );
  }

  if (discardOption === "discardNone") {
    game.drawPile.unshift(cardA, cardB);

    await pushGameChat(
      game,
      lobbyid,
      `${username} peeked at two cards and put both back into the deck`
    );
  }

  game.currentRound.playerPeeking = null;
  transitionPhase(game, "Judge Picks Partner");
  await game.save();

  await triggerPusherEvent(`gameUpdate-${lobbyid}`, "updateDeckCount", {
    cardsLeft: game.drawPile.length,
  });
 
  return NextResponse.json({ success: true });
}

export async function handleVetoIfApplicable(game, isBlue, lobbyid) {
  if (!isBlue && game.HonestVetoEnabled) {
    const honestWins = game.players.length === 6;

    return handleVetoGeneric(
      game,
      lobbyid,
      "Good",
      honestWins ? "game ended" : "Judge Picks Partner",
      [
        "Entire team is good",
        "Corrupt evidence automatically vetoed",
        honestWins ? "Honest team has won" : "Judge needs to pick a new team",
      ]
    );
  }

  if (isBlue && game.CorruptVetoEnabled) {
    return handleVetoGeneric(game, lobbyid, "Evil", "game ended", [
      "Entire team is corrupt",
      "Honest evidence automatically vetoed",
      "Corrupt team has won",
    ]);
  }

  return false;
}

/* ---------------- Judge Investigation ---------------- */

export async function judgePicksInvestigator(par) {
  await handleJudgePick(
    par,
    "playerInvestigating",
    "investigation",
    (clicker, selected) =>
      `${clicker.player.username} picked ${selected.player.username} to investigate`
  );
}

export async function judgePicksReverseInvestigator(par) {
  await handleJudgePick(
    par,
    "playerReverseInvestigating",
    "reverse investigation",
    (clicker, selected) =>
      `${clicker.player.username} picked ${selected.player.username} to reverse investigate`
  );
}

async function handleJudgePick(par, roleField, nextPhase, chatMsg) {
  if (
    par.playerClickingId.equals(par.game.currentRound.judge) &&
    !par.game[roleField]
  ) {
    par.game[roleField] = par.selectedPlayerId;

    await pushGameChat(
      par.game,
      par.lobbyid,
      chatMsg(
        { player: { username: par.playerClickingUsername } },
        { player: { username: par.selectedPlayerUsername } }
      )
    );

    transitionPhase(par.game, nextPhase);
  }
}

/* ---------------- Investigation ---------------- */

export async function handleInvestigation(par) {
  await handleInvestigationGeneric(par, {
    roleField: "playerInvestigating",
    beingField: "playerBeingInvestigated",
    eventKey: "investigation",
    chatMsg: (clicker, selected) =>
      `${clicker.player.username} chose to see ${selected.player.username}'s role`,
    nextPhase: "Judge Picks Partner",
  });
}

export async function handleReverseInvestigation(par) {
  await handleInvestigationGeneric(par, {
    roleField: "playerReverseInvestigating",
    beingField: "playerBeingReverseInvestigated",
    eventKey: "reverse investigation",
    chatMsg: (clicker, selected) =>
      `${clicker.player.username} chose to show ${selected.player.username} their role`,
    nextPhase: "Judge Picks Partner",
  });
}
