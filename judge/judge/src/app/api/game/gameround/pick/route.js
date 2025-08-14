import { NextResponse } from "next/server";
import connectToDB from "@/lib/utils";
import { Game, User } from "@/lib/models";
import Pusher from "pusher";
import { reshuffleDeck } from "@/lib/utils";
import { transitionPhase } from "@/lib/phaseTransition";

const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET } = process.env;

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

    case "Peek and Discard":
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
  if (par.playerClickingId.equals(par.game.currentRound.judge)) {
    if (!par.unselectables.includes(par.selectedPlayerId)) {
      par.game.currentRound.partner.id = par.selectedPlayerId;
      transitionPhase(par.game, "Partner Picks Associate");

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
  if (par.playerClickingId.equals(par.game.currentRound.partner.id)) {
    if (!par.unselectables.includes(par.selectedPlayerId)) {
      par.game.currentRound.associate.id = par.selectedPlayerId;
      transitionPhase(par.game, "Associate Picks Paralegal");
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
  if (par.playerClickingId.equals(par.game.currentRound.associate.id)) {
    if (!par.unselectables.includes(par.selectedPlayerId)) {
      par.game.currentRound.paralegal.id = par.selectedPlayerId;
      par.game.gameChat.push(
        `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Paralegal`
      );

      await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "gamechat", {
        gamechat: par.game.gameChat,
      });
      await setUpForNextCardPhase(par);
    }
  }
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

async function handlePeekAndDiscard(par) {
  if (
    par.playerClickingId.equals(par.game.currentRound.judge) &&
    par.game.currentRound.playerPeeking.id == null
  ) {
    par.game.currentRound.playerPeeking = {
      id: par.selectedPlayerId,
      cards: [],
    };
    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to peek at cards and discard`
    );

    await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "gamechat", {
      gamechat: par.game.gameChat,
    });
    par.game.currentRound.playerPeeking.cards = par.game.drawPile.splice(0, 2);

    await triggerPusherEvent(
      `gameUpdate-${par.lobbyid}-${par.selectedPlayerId}`,
      "peekAndDiscardPhaseStarted",
      { cards: par.game.currentRound.playerPeeking.cards }
    );
    await triggerPusherEvent(
      `gameUpdate-${par.game.gameid}`,
      "updateDeckCount",
      { cardsLeft: par.game.drawPile.length }
    );
  }
}

async function judgePicksInvestigator(par) {
  if (
    par.playerClickingId.equals(par.game.currentRound.judge) &&
    par.game.playerInvestigating == null
  ) {
    par.game.playerInvestigating = par.selectedPlayerId;
    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to investigate`
    );

    await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "gamechat", {
      gamechat: par.game.gameChat,
    });
    transitionPhase(par.game, "investigation");
  }
}

async function judgePicksReverseInvestigator(par) {
  if (
    par.playerClickingId.equals(par.game.currentRound.judge) &&
    par.game.playerReverseInvestigating == null
  ) {
    par.game.playerReverseInvestigating = par.selectedPlayerId;
    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to reverse investigate`
    );

    await triggerPusherEvent(`gameUpdate-${par.lobbyid}`, "gamechat", {
      gamechat: par.game.gameChat,
    });
    transitionPhase(par.game, "reverse investigation");
  }
}

async function handleInvestigation(par) {
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
    } else {
      console.error("Player data could not be found for investigation.");
    }
  }

  transitionPhase(par.game, "Judge Picks Partner");
}

async function handleReverseInvestigation(par) {
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
    } else {
      console.error(
        "Player data could not be found for reverse investigation."
      );
    }
  }
  transitionPhase(par.game, "Judge Picks Partner");
}
