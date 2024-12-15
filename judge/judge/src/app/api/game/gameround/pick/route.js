import { NextResponse } from "next/server";
import connectToDB, { fetchUsername } from "@/lib/utils";
import { Game, User } from "@/lib/models";
import { UpdateTermlocks } from "@/lib/updateTermlocks";
import { triggerPusherEvent, updateGameUI } from "@/lib/pusher";
import {
  judgePicksInvestigator,
  judgePicksReverseInvestigator,
  handleInvestigation,
  handleReverseInvestigation,
  handlePeekAndDiscardPick,
} from "@/lib/powers";
import { setPlayerTurn } from "@/lib/gameround";
import { setUpForCardPhase } from "@/lib/gameround";

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
  const judge = game.players[0].player;
  const args = {
    game,
    playerClickingId,
    selectedPlayerId: selectedPlayer_._id,
    selectedPlayerUsername: selectedPlayer_.username,
    playerClickingUsername: playerClicking,
    lobbyid,
    judge,
  };

  const phaseHandlers = {
    "Judge Picks Partner": handleJudgePicksPartner,
    "Partner Picks Associate": handlePartnerPicksAssociate,
    "Associate Picks Paralegal": handleAssociatePicksParalegal,
    "Peek and Discard": handlePeekAndDiscardPick,
    "Judge picks investigator": judgePicksInvestigator,
    "Judge picks reverse investigator": judgePicksReverseInvestigator,
    investigation: handleInvestigation,
    "reverse investigation": handleReverseInvestigation,
  };

  await handlePickAction(phase, args, phaseHandlers);

  await game.save();
  return NextResponse.json({ success: true });
}

async function handlePickAction(phase, args, phaseHandlers) {
  if (phase in phaseHandlers) {
    const handler = phaseHandlers[phase];
    await handler(args);
  } else {
    throw new Error("Invalid phase");
  }
}

async function handleJudgePicksPartner(par) {
  const validation = isValidSelection(
    par.game,
    par.selectedPlayerId,
    par.playerClickingId,
    par.selectedPlayerUsername
  );
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  await setPlayerTurn(par.game, par.selectedPlayerId, par.playerClickingId);
  par.game.currentRound.partner.id = par.selectedPlayerId;
  par.game.currentRound.phase = "Partner Picks Associate";
  par.game.gameChat.push(
    `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Partner`
  );

  par.game.banner = `${par.selectedPlayerUsername} should select an Associate`;

  par.game.unpickablePlayers.push(par.selectedPlayerUsername);
  if (par.game.previousTeam?.associate) {
    par.game.unpickablePlayers.push(
      await fetchUsername(par.game.previousTeam.associate)
    );
  }
  if (par.game.previousTeam?.partner) {
    const PreviousPartnerUsername = await fetchUsername(
      par.game.previousTeam.partner
    );
    const partnerIndex = par.game.unpickablePlayers.indexOf(
      PreviousPartnerUsername
    );
    if (partnerIndex !== -1) {
      par.game.unpickablePlayers.splice(partnerIndex, 1);
    }
  }
  await UpdateTermlocks(par.game, par.game.players.length); // line under check
  await updateGameUI(par.game, par.lobbyid);
}

async function handlePartnerPicksAssociate(par) {
  const validation = isValidSelection(
    par.game,
    par.selectedPlayerId,
    par.playerClickingId,
    par.selectedPlayerUsername
  );
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  await setPlayerTurn(par.game, par.selectedPlayerId, par.playerClickingId);
  par.game.currentRound.associate.id = par.selectedPlayerId;
  par.game.currentRound.phase = "Associate Picks Paralegal";
  par.game.gameChat.push(
    `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Associate`
  );

  par.game.banner = `${par.selectedPlayerUsername} should select a Paralegal`;

  par.game.unpickablePlayers.push(par.selectedPlayerUsername);
  if (par.game.previousTeam?.paralegal) {
    par.game.unpickablePlayers.push(
      await fetchUsername(par.game.previousTeam.paralegal)
    );
  }
  if (par.game.previousTeam?.associate) {
    const PreviousAssociateUsername = await fetchUsername(
      par.game.previousTeam.associate
    );
    const associateIndex = par.game.unpickablePlayers.indexOf(
      PreviousAssociateUsername
    );
    if (associateIndex !== -1) {
      par.game.unpickablePlayers.splice(associateIndex, 1);
    }
  }
  await UpdateTermlocks(par.game, par.game.players.length); // line under check
  await updateGameUI(par.game, par.lobbyid);
}

async function handleAssociatePicksParalegal(par) {
  const validation = isValidSelection(
    par.game,
    par.selectedPlayerId,
    par.playerClickingId,
    par.selectedPlayerUsername
  );
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  par.game.currentRound.paralegal.id = par.selectedPlayerId;
  par.game.gameChat.push(
    `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Paralegal`
  );
  par.game.banner = `The Paralegal and Associate are selecting which card to discard`;

  const prevPlayerOnTurnIndex = par.game.players.findIndex((player) =>
    player.player.equals(par.playerClickingId)
  );
  if (prevPlayerOnTurnIndex !== -1) {
    par.game.players[prevPlayerOnTurnIndex].isOnTurn = false;
  }

  triggerPusherEvent(
    `gameUpdate-${par.game.gameid}-${par.playerClickingId}`,
    "myTurn",
    { turn: false }
  );

  await updateGameUI(par.game, par.lobbyid);

  await setUpForCardPhase(par);
}

function isValidSelection(
  game,
  selectedPlayerId,
  playerClickingId,
  selectedPlayerUsername
) {
  if (
    selectedPlayerId.equals(game.players[0].player) ||
    playerClickingId.equals(selectedPlayerId)
  ) {
    return {
      valid: false,
      error: "Cannot select the judge or yourself",
    };
  }
  console.log("these are the termlocked players ", game.unpickablePlayers);
  console.log("this is the selected player", selectedPlayerUsername);
  if (game.unpickablePlayers.includes(selectedPlayerUsername)) {
    console.log("this clause happens");
    return {
      valid: false,
      error: `selectedPlayer is unpickable`,
    };
  }
  return { valid: true };
}
