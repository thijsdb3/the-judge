import { NextResponse } from "next/server";
import connectToDB, { pushGameChat } from "@/lib/utils";
import { Game, User } from "@/lib/models";
import { reshuffleDeck } from "@/lib/utils";
import { transitionPhase, triggerPusherEvent } from "@/lib/phaseTransition";
import {
  judgePicksInvestigator,
  judgePicksReverseInvestigator,
  handleInvestigation,
  handleReverseInvestigation,
  handlePeekAndDiscard,
} from "@/lib/specialPowers";

export async function POST(request) {
  const { lobbyid, selectedPlayer, playerClicking } = await request.json();

  await connectToDB();
  const game = await Game.findOne({ gameid: lobbyid });

  const [selectedPlayer_, playerClicking_] = await Promise.all([
    User.findOne({ username: selectedPlayer.username }),
    User.findOne({ username: playerClicking }),
  ]);

  if (!game || !selectedPlayer_ || !playerClicking_) {
    return NextResponse.json(
      {
        error: `${
          !game
            ? "Game"
            : !selectedPlayer_
            ? "Selected player"
            : "Player performing the action"
        } not found`,
      },
      { status: 404 }
    );
  }

  const playerClickingId = playerClicking_._id;
  const phase = game.currentRound.phase;
  const unselectables = game.currentRound.unselectables;

  const args = {
    game,
    playerClickingId,
    selectedPlayerId: selectedPlayer_._id,
    selectedPlayerUsername: selectedPlayer_.username,
    playerClickingUsername: playerClicking,
    lobbyid,
    unselectables,
  };

  if (
    selectedPlayer_._id.equals(game.currentRound.judge) ||
    playerClickingId.equals(selectedPlayer_._id)
  ) {
    return NextResponse.json(
      { error: "Cannot select the judge or yourself" },
      { status: 400 }
    );
  }

  switch (phase) {
    case "Judge Picks Partner":
      await handleJudgePicksPartner(args);
      break;

    case "Partner Picks Associate":
      await handlePartnerPicksAssociate(args);
      break;

    case "Associate Picks Paralegal":
      await handleAssociatePicksParalegal(args);
      break;

    case "Choose Peeking Player":
      await handlePeekAndDiscard(args);
      break;
    case "Judge picks investigator":
      await judgePicksInvestigator(args);
      break;
    case "Judge picks reverse investigator":
      await judgePicksReverseInvestigator(args);
      break;
    case "investigation":
      await handleInvestigation(args);
      break;
    case "reverse investigation":
      await handleReverseInvestigation(args);
      break;

    default:
      return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  }
  await game.save();
  return NextResponse.json({ success: true });
}

async function handleJudgePicksPartner(par) {
  return handleRolePick({
    par,
    requiredRoleId: par.game.currentRound.judge,
    assignRolePath: (game, id) => (game.currentRound.partner.id = id),
    nextPhase: "Partner Picks Associate",
    chatMessage: `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Partner`,
  });
}

async function handlePartnerPicksAssociate(par) {
  return handleRolePick({
    par,
    requiredRoleId: par.game.currentRound.partner.id,
    assignRolePath: (game, id) => (game.currentRound.associate.id = id),
    nextPhase: "Associate Picks Paralegal",
    chatMessage: `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Associate`,
  });
}

async function handleAssociatePicksParalegal(par) {
  if (!par.playerClickingId.equals(par.game.currentRound.associate.id)) return;
  if (par.unselectables.includes(par.selectedPlayerId)) return;

  par.game.currentRound.paralegal.id = par.selectedPlayerId;

  await pushGameChat(
    par.game,
    par.lobbyid,
    `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Paralegal`
  );

  await setUpForNextCardPhase(par);
}

async function setUpForNextCardPhase(par) {
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

  await triggerPusherEvent(`gameUpdate-${par.game.gameid}`, "updateDeckCount", {
    cardsLeft: par.game.drawPile.length,
  });
  transitionPhase(par.game, "seeCards");

  await triggerPusherEvent(
    `gameUpdate-${par.game.gameid}-${par.game.currentRound.associate.id}`,
    "cardPhaseStarted",
    {}
  );

  await triggerPusherEvent(
    `gameUpdate-${par.game.gameid}-${par.game.currentRound.paralegal.id}`,
    "cardPhaseStarted",
    {}
  );
}

async function handleRolePick({
  par,
  requiredRoleId,
  assignRolePath,
  nextPhase,
  chatMessage,
}) {
  if (!par.playerClickingId.equals(requiredRoleId)) return;
  if (par.unselectables.includes(par.selectedPlayerId)) return;

  assignRolePath(par.game, par.selectedPlayerId);
  transitionPhase(par.game, nextPhase);

  await pushGameChat(par.game, par.lobbyid, chatMessage);
}
