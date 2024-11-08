import { NextResponse } from "next/server";
import connectToDB from "@/lib/utils";
import { Game, User } from "@/lib/models";
import { isNotTeamLocked,reshuffleDeck} from "@/lib/utils";
import { triggerPusherEvent } from "@/lib/pusher";
import { judgePicksInvestigator,judgePicksReverseInvestigator,handleInvestigation,handleReverseInvestigation ,handlePeekAndDiscardPick } from "@/lib/powers";

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
  const playercount = game.players.length;
  const args = {
    game,
    playercount,
    playerClickingId,
    selectedPlayerId: selectedPlayer_._id,
    selectedPlayerUsername: selectedPlayer_.username,
    playerClickingUsername: playerClicking,
    lobbyid,
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

    case "Peek and Discard":
      await handlePeekAndDiscardPick(args);
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
  if (
    par.playerClickingId.equals(par.game.judge) &&
    !par.selectedPlayerId.equals(par.game.previousTeam.partner)
  ) {
    const playercount = par.playercount;
    if (
      isNotTeamLocked(par.game, par.selectedPlayerId, playercount)
    ) {
      par.game.currentRound.partner.id = par.selectedPlayerId;
      par.game.currentRound.phase = "Partner Picks Associate";
      par.game.gameChat.push(
        `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Partner`
      );

      await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "gamechat", {
        gamechat: par.game.gameChat,
      });
    }
  }
}

async function handlePartnerPicksAssociate(par) {
  if (
    par.playerClickingId.equals(par.game.currentRound.partner.id) &&
    !par.selectedPlayerId.equals(par.game.currentRound.partner.id) &&
    !par.selectedPlayerId.equals(par.game.previousTeam.associate)
  ) {
    const playercount = par.playercount;
    if (
      isNotTeamLocked(par.game, par.selectedPlayerId, playercount)
    ) {
      par.game.currentRound.associate.id = par.selectedPlayerId;
      par.game.currentRound.phase = "Associate Picks Paralegal";
      par.game.gameChat.push(
        `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Associate`
      );
      await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "gamechat", {
        gamechat: par.game.gameChat,
      });
    }
  }
}

async function handleAssociatePicksParalegal(par) {
  if (
    par.playerClickingId.equals(par.game.currentRound.associate.id) &&
    !par.selectedPlayerId.equals(par.game.currentRound.partner.id) &&
    !par.selectedPlayerId.equals(par.game.currentRound.associate.id) &&
    !par.selectedPlayerId.equals(par.game.previousTeam.paralegal)
  ) {
    const playercount = par.playercount;
    if (
      isNotTeamLocked(par.game, par.selectedPlayerId, playercount)
    ) {
      par.game.currentRound.paralegal.id = par.selectedPlayerId;
      par.game.gameChat.push(
        `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Paralegal`
      );

      await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "gamechat", {
        gamechat: par.game.gameChat,
      });
      await setUpForCardPhase(par);
    }
  }
}

async function setUpForCardPhase(par) {
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
  par.game.currentRound.phase = "seeCards";
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



