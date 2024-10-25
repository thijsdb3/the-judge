import { NextResponse } from "next/server";
import connectToDB from "@/lib/utils";
import { Game } from "@/lib/models";
import Pusher from "pusher";

// Initialize Pusher
const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET } = process.env;

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: NEXT_PUBLIC_PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: "eu",
});

export async function POST(request) {
  const { lobbyid, userid, action, card, discardOption } = await request.json();
  await connectToDB();

  const game = await Game.findOne({ gameid: lobbyid });

  let userCards =
    userid === game.currentRound.associate.id?.toString()
      ? game.currentRound.associate.cards
      : game.currentRound.paralegal.cards;

  switch (action) {
    case "seeCards":
      return handleSeeCards(game, userCards, lobbyid, userid);

    case "discardCard":
      return handleDiscardCard(game, userid, userCards, card, lobbyid);

    case "Peek and Discard":
      return handlePeekAndDiscard(game, discardOption, card, lobbyid);

    default:
      return NextResponse.json(
        { error: "Invalid action specified." },
        { status: 400 }
      );
  }
}

// Function to handle seeing cards
async function handleSeeCards(game, userCards, lobbyid, userid) {
  game.currentRound.phase = "seeCards";
  await pusher.trigger(`gameUpdate-${lobbyid}-${userid}`, "seeCards", {
    cards: userCards,
  });
  return NextResponse.json({ cards: userCards });
}

async function triggerPusherEvent(channel, event, data) {
  await pusher.trigger(channel, event, data);
}

// Function to handle discarding a card
async function handleDiscardCard(game, userid, userCards, card, lobbyid) {
  game.currentRound.phase = "discardCard";
  const { partner, associate, paralegal } = game.currentRound;
  const remainingCards = userCards.filter(
    (c, i) => i !== userCards.indexOf(card)
  );

  if (userid == partner.id?.toString()) {
    game.discardPile.push(...remainingCards);

    const blueCount = remainingCards.filter((card) => card == "blue").length;
    const isBlue = blueCount > remainingCards.length / 2;

    game.gameChat.push(isBlue ? "blue card enacted" : "red card enacted");
    game.boardState[isBlue ? "blues" : "reds"] += 1;

    await Promise.all([
      triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
        gamechat: game.gameChat,
      }),
      triggerPusherEvent(
        `gameUpdate-${lobbyid}`,
        `${isBlue ? "Blue" : "Red"}Update`,
        {
          [`${isBlue ? "bluestate" : "redstate"}`]:
            game.boardState[isBlue ? "blues" : "reds"],
        }
      ),
    ]);

    if (await checkWinCondition(game, isBlue, lobbyid)) {
      return NextResponse.json({ message: "game played successfully" });
    }

    const playercount = game.players.length;

    if (!isBlue && game.boardState.reds === 2) {
      await transitionPhase(game, "Peek and Discard");
      return;
    }
    //TO DO update to >= 7
    if (!isBlue && game.boardState.reds === 3 && playercount >= 4) {
      await transitionPhase(game, "Judge picks investigator");
      return;
    }
    //TO DO update to >= 11
    if (!isBlue && game.boardState.reds === 4 && playercount >= 4) {
      await transitionPhase(game, "Judge picks reverse investigator");
      return;
    }

    await clearRound(game);
  } else {
    if (userid === associate.id.toString()) {
      associate.cards = remainingCards;
    } else {
      paralegal.cards = remainingCards;
    }
    game.discardPile.push(card);
  }

  if (associate.cards?.length === 2 && paralegal.cards?.length === 2) {
    partner.cards = [...associate.cards, ...paralegal.cards];
    await triggerPusherEvent(
      `gameUpdate-${lobbyid}-${partner.id?.toString()}`,
      "receivePartnerCards",
      {
        cards: partner.cards,
      }
    );
  }

  await game.save();
  return NextResponse.json({ message: "Card discarded successfully" });
}

async function handlePeekAndDiscard(game, discardOption, card, lobbyid) {
  const peekedCards = game.currentRound.playerPeeking.cards;

  if (discardOption === "discardOne" && card) {
    const remainingCards = peekedCards.filter(
      (c, i) => i !== peekedCards.indexOf(card)
    );
    game.drawPile.unshift(...remainingCards);
    game.discardPile.push(card);
  } else if (discardOption === "discardNone") {
    game.drawPile.unshift(...peekedCards);
  }

  await pusher.trigger(`gameUpdate-${lobbyid}`, "updateDeckCount", {
    cardsLeft: game.drawPile.length,
  });
  await clearRound(game);
  return NextResponse.json({ message: "Peek and Discard completed" });
}

// Function to handle phase transitions
async function transitionPhase(game, newPhase) {
  game.currentRound.phase = newPhase;
  await game.save();
}

// function to clear the round to set up for the next
async function clearRound(game) {
  game.previousTeam.partner = game.currentRound.partner.id;
  game.previousTeam.associate = game.currentRound.associate.id;
  game.previousTeam.paralegal = game.currentRound.paralegal.id;
  game.currentRound.partner.id = null;
  game.currentRound.associate.id = null;
  game.currentRound.paralegal.id = null;
  game.currentRound.partner.cards = null;
  game.currentRound.associate.cards = null;
  game.currentRound.paralegal.cards = null;

  // Transition to the next phase after clearing the round
  await transitionPhase(game, "Judge Picks Partner");
}

async function checkWinCondition(game, isBlue, lobbyid) {
  if (
    (isBlue && game.boardState.blues === 5) ||
    (!isBlue && game.boardState.reds === 5)
  ) {
    const winningMessage = isBlue
      ? "honest team has won!"
      : "corrupt team has won!";
    game.gameChat.push(winningMessage);
    await pusher.trigger(`gameUpdate-${lobbyid}`, "gamechat", {
      gamechat: game.gameChat,
    });
    await transitionPhase(game, "game ended");
    return true;
  }
  return false;
}
