import { NextResponse } from "next/server";
import connectToDB from "@/lib/utils";
import { Game, User } from "@/lib/models";
import Pusher from "pusher";
import { fisherYatesShuffle } from "@/lib/utils";

const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET } = process.env;

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: NEXT_PUBLIC_PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: "eu",
});

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

  const args = {
    game: game,
    playerClickingId: playerClickingId,
    selectedPlayerId: selectedPlayer_._id,
    selectedPlayerUsername: selectedPlayer_.username,
    playerClickingUsername: playerClicking,
    lobbyid: lobbyid,
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
      handleJudgePicksPartner(args);
      break;

    case "Partner Picks Associate":
      handlePartnerPicksAssociate(args);
      break;

    case "Associate Picks Paralegal":
      handleAssociatePicksParalegal(args);
      break;

    case "Peek and Discard":
      game.currentRound.partner.id = null;
      game.currentRound.associate.id = null;
      game.currentRound.paralegal.id = null;
      handlePeekAndDiscard(args);
      break;
    case "Judge picks investigator":
      game.currentRound.partner.id = null;
      game.currentRound.associate.id = null;
      game.currentRound.paralegal.id = null;
      JudgePicksInvestigator(args);
      break;
    case "Judge picks reverse investigator":
      game.currentRound.partner.id = null;
      game.currentRound.associate.id = null;
      game.currentRound.paralegal.id = null;
      JudgePicksReverseInvestigator(args);
      break;
    case "investigation":
      handleInvestigation(args);
      break;
    case "reverse investigation":
      handleReverseInvestigation(args);
      break;

    default:
      return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  }

  await game.save();
  return NextResponse.json({ success: true });
}

function handleJudgePicksPartner(par) {
  if (par.playerClickingId.equals(par.game.currentRound.judge)) {
    par.game.currentRound.partner.id = par.selectedPlayerId;
    par.game.currentRound.phase = "Partner Picks Associate"; // Move to next phase
    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Partner`
    );

    pusher.trigger(`gameUpdate-${par.lobbyid}`, "gamechat", {
      gamechat: par.game.gameChat,
    });
  }
}

function handlePartnerPicksAssociate(par) {
  if (
    par.playerClickingId.equals(par.game.currentRound.partner.id) &&
    !par.selectedPlayerId.equals(par.game.currentRound.partner.id)
  ) {
    par.game.currentRound.associate.id = par.selectedPlayerId;
    par.game.currentRound.phase = "Associate Picks Paralegal";
    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Associate`
    );
    pusher.trigger(`gameUpdate-${par.lobbyid}`, "gamechat", {
      gamechat: par.game.gameChat,
    });
  }
}

function handleAssociatePicksParalegal(par) {
  if (
    par.playerClickingId.equals(par.game.currentRound.associate.id) &&
    !par.selectedPlayerId.equals(par.game.currentRound.partner.id) &&
    !par.selectedPlayerId.equals(par.game.currentRound.associate.id)
  ) {
    par.game.currentRound.paralegal.id = par.selectedPlayerId;
    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to be the Paralegal`
    );

    pusher.trigger(`gameUpdate-${par.lobbyid}`, "gamechat", {
      gamechat: par.game.gameChat,
    });
    setUpForNextCardPhase(par);
  }
}

function setUpForNextCardPhase(par) {
  if (par.game.drawPile.length >= 6) {
    par.game.currentRound.associate.cards = par.game.drawPile.slice(0, 3);
    par.game.currentRound.paralegal.cards = par.game.drawPile.slice(3, 6);
    par.game.drawPile.splice(0, 6);
  } else if (par.game.drawPile.length >= 3) {
    par.game.currentRound.associate.cards = par.game.drawPile.slice(0, 3);
    par.game.drawPile = reshuffledeck(par.game);
    par.game.currentRound.paralegal.cards = par.game.drawPile.slice(0, 3);
    par.game.drawPile.splice(0, 3);
  } else {
    // impossible scenario with current implementation of game
    par.game.drawPile = reshuffledeck(par.game);
    par.game.currentRound.associate.cards = par.game.drawPile.slice(0, 3);
    par.game.currentRound.paralegal.cards = par.game.drawPile.slice(3, 6);
    par.game.drawPile.splice(0, 6);
  }

  pusher.trigger(`gameUpdate-${par.game.gameid}`, "updateDeckCount", {
    cardsLeft: par.game.drawPile.length,
  });
  par.game.currentRound.phase = "seeCards";
  pusher.trigger(
    `gameUpdate-${par.game.gameid}-${par.game.currentRound.associate.id}`,
    "cardPhaseStarted",
    {}
  );

  pusher.trigger(
    `gameUpdate-${par.game.gameid}-${par.game.currentRound.paralegal.id}`,
    "cardPhaseStarted",
    {}
  );
}

function reshuffledeck(game) {
  const drawPile = game.drawPile;
  const discardPile = game.discardPile;
  const newDeck = drawPile.concat(discardPile);
  const shuffledDeck = fisherYatesShuffle(newDeck);

  game.discardPile = [];

  return shuffledDeck;
}

function handlePeekAndDiscard(par) {
  // check if the player selecting is the Judge and nobody has been selected yet
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

    pusher.trigger(`gameUpdate-${par.lobbyid}`, "gamechat", {
      gamechat: par.game.gameChat,
    });
    par.game.currentRound.playerPeeking.cards = par.game.drawPile.slice(0, 2);
    par.game.drawPile.splice(0, 2);
    // Signal to the selected player to start the card peeking and discarding phase
    pusher.trigger(
      `gameUpdate-${par.lobbyid}-${par.selectedPlayerId}`,
      "peekAndDiscardPhaseStarted",
      {
        cards: par.game.currentRound.playerPeeking.cards,
      }
    );

    pusher.trigger(`gameUpdate-${par.game.gameid}`, "updateDeckCount", {
      cardsLeft: par.game.drawPile.length,
    });
  }
}

function JudgePicksInvestigator(par) {
  // check if the player selecting is the Judge and nobody has been selected yet
  if (
    par.playerClickingId.equals(par.game.currentRound.judge) &&
    par.game.playerInvestigating == null
  ) {
    par.game.playerInvestigating = par.selectedPlayerId;

    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to investigate`
    );

    pusher.trigger(`gameUpdate-${par.lobbyid}`, "gamechat", {
      gamechat: par.game.gameChat,
    });
    par.game.currentRound.phase = "investigation";
  }
}

function JudgePicksReverseInvestigator(par) {
  // check if the player selecting is the Judge and nobody has been selected yet
  if (
    par.playerClickingId.equals(par.game.currentRound.judge) &&
    par.game.playerReverseInvestigating == null
  ) {
    par.game.playerReverseInvestigating = par.selectedPlayerId;

    par.game.gameChat.push(
      `${par.playerClickingUsername} picked ${par.selectedPlayerUsername} to reverse investigate`
    );

    pusher.trigger(`gameUpdate-${par.lobbyid}`, "gamechat", {
      gamechat: par.game.gameChat,
    });
    par.game.currentRound.phase = "reverse investigation";
  }
}

async function handleInvestigation(par) {
  if (
    par.playerClickingId.equals(par.game.playerInvestigating) &&
    par.game.playerBeingInvestigated == null
  ) {
    par.game.playerBeingInvestigated = par.selectedPlayerId;

    // Populate players to retrieve player usernames
    await par.game.populate("players.player");

    // Find the usernames of the player clicking and player being clicked
    const playerClicking = par.game.players.find((p) =>
      p.player._id.equals(par.playerClickingId)
    );
    const playerBeingClicked = par.game.players.find((p) =>
      p.player._id.equals(par.selectedPlayerId)
    );

    if (playerClicking && playerBeingClicked) {
      par.game.gameChat.push(
        `${par.playerClickingUsername} chose  to see ${par.selectedPlayerUsername}'s role`
      );

      await pusher.trigger(`gameUpdate-${par.lobbyid}`, "gamechat", {
        gamechat: par.game.gameChat,
      });

      await pusher.trigger(
        `gameUpdate-${par.lobbyid}-${par.playerClickingId}`,
        "investigation",
        {
          playerInvestigating: playerClicking.player.username,
          playerBeingInvestigated: playerBeingClicked.player.username,
        }
      );
    } else {
      console.error("Player data could not be found for investigation.");
    }
  }

  par.game.currentRound.phase = "Judge Picks Partner";
}

async function handleReverseInvestigation(par) {
  if (
    par.playerClickingId.equals(par.game.playerReverseInvestigating) &&
    par.game.playerBeingReverseInvestigated == null
  ) {
    par.game.playerBeingReverseInvestigated = par.selectedPlayerId;

    // Populate players to retrieve player usernames
    await par.game.populate("players.player");

    // Find the usernames of the player clicking and player being clicked
    const playerClicking = par.game.players.find((p) =>
      p.player._id.equals(par.playerClickingId)
    );
    const playerBeingClicked = par.game.players.find((p) =>
      p.player._id.equals(par.selectedPlayerId)
    );



    if (playerClicking && playerBeingClicked) {
      par.game.gameChat.push(
        `${par.playerClickingUsername} chose  to show  ${par.selectedPlayerUsername} their role`
      );

      await pusher.trigger(`gameUpdate-${par.lobbyid}`, "gamechat", {
        gamechat: par.game.gameChat,
      });

      await pusher.trigger(
        `gameUpdate-${par.lobbyid}-${par.selectedPlayerId}`,
        "reverse investigation",
        {
          playerReverseInvestigating: playerClicking.player.username,
          playerBeingReverseInvestigated: playerBeingClicked.player.username,
        }
      );
    } else {
      console.error(
        "Player data could not be found for reverse investigation."
      );
    }
  }

  par.game.currentRound.phase = "Judge Picks Partner";
}
