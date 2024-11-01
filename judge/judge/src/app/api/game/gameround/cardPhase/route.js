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
  const { lobbyid, userid, action, card, discardOption } = await request.json();
  await connectToDB();

  const game = await Game.findOne({ gameid: lobbyid });
  let userCards;
  switch (userid) {
    case game.currentRound.associate.id?.toString():
      userCards = game.currentRound.associate.cards;
      break;
    case game.currentRound.paralegal.id?.toString():
      userCards = game.currentRound.paralegal.cards;
      break;
    case game.currentRound.partner.id?.toString():
      userCards = game.currentRound.partner.cards;
      break;
  }

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
  await triggerPusherEvent(`gameUpdate-${lobbyid}-${userid}`, "seeCards", {
    cards: userCards,
  });
  return NextResponse.json({ cards: userCards });
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
    console.log("these are the partners user cards", userCards);
    console.log("these are the partners remaining cards", remainingCards);
    const blueCount = remainingCards.filter((card) => card == "blue").length;
    const isBlue = blueCount > remainingCards.length / 2;

    if (!isBlue && game.HonestVetoEnabled) {
      if (await handleHonestVeto(game, lobbyid)) {
        return NextResponse.json({ message: "veto used" });
      }
    }

    if (isBlue && game.CorruptVetoEnabled) {
      if (await handleCorruptVeto(game, lobbyid)) {
        return NextResponse.json({ message: "veto used" });
      }
    }

    game.gameChat.push(
      isBlue ? "honest evidence enacted" : "corrupt evidence enacted"
    );
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
      await clearRound(game);
      await transitionPhase(game, "Peek and Discard");
      return NextResponse.json({ message: "peek initialised sucesfully" });
    }
    if (!isBlue && game.boardState.reds === 3 && playercount >= 7) {
      await clearRound(game);
      await transitionPhase(game, "Judge picks investigator");
      return NextResponse.json({ message: "prepped for inv successfully" });
    }
    if (!isBlue && game.boardState.reds === 4) {
      game.HonestVetoEnabled = true;
      console.log("honest veto is:", game.HonestVetoEnabled);
      if (playercount >= 9) {
        await clearRound(game);
        await transitionPhase(game, "Judge picks reverse investigator");
        return NextResponse.json({
          message: "prepped for reverse inv sucesfully",
        });
      }
    }

    if (isBlue && game.boardState.blues === 4 && game.boardState.reds === 4) {
      game.CorruptVetoEnabled = true;
    }

    await clearRound(game);
    await transitionPhase(game, "Judge Picks Partner");
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
  console.log("these are the peeked cards", peekedCards);

  if (discardOption === "discardOne" && card) {
    const remainingCards = peekedCards.filter(
      (c, i) => i !== peekedCards.indexOf(card)
    );
    game.drawPile.unshift(...remainingCards);
    console.log("this is the remaining card:", remainingCards);
    console.log("this is the discarded card:", card);
    console.log("this is the deck:", game.drawPile);
    game.discardPile.push(card);
    console.log("this is the discardPile:", game.discardPile);
  } else if (discardOption === "discardNone") {
    game.drawPile.unshift(...peekedCards);
    console.log("this is the deck if discardnone:", game.drawPile);
  }

  await triggerPusherEvent(`gameUpdate-${lobbyid}`, "updateDeckCount", {
    cardsLeft: game.drawPile.length,
  });

  await clearRound(game);
  await transitionPhase(game, "Judge Picks Partner");
  return NextResponse.json({ message: "Peek and Discard completed" });
}

// Function to handle phase transitions
async function transitionPhase(game, newPhase) {
  game.currentRound.phase = newPhase;
  await game.save();
}

// function to clear the round to set up for the next
async function clearRound(game) {
  if (game.currentRound.partner.id) {
    game.previousTeam.partner = game.currentRound.partner.id;
  }

  if (game.currentRound.associate.id) {
    game.previousTeam.associate = game.currentRound.associate.id;
  }

  if (game.currentRound.paralegal.id) {
    game.previousTeam.paralegal = game.currentRound.paralegal.id;
  }

  game.currentRound.partner.id = null;
  game.currentRound.associate.id = null;
  game.currentRound.paralegal.id = null;
  game.currentRound.partner.cards = null;
  game.currentRound.associate.cards = null;
  game.currentRound.paralegal.cards = null;

  await game.save();
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
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
      gamechat: game.gameChat,
    });
    await transitionPhase(game, "game ended");
    return true;
  }
  return false;
}

async function handleCorruptVeto(game, lobbyid) {
  const partner = game.players.find((p) =>
    p.player._id.equals(game.currentRound.paralegal.id)
  );
  const associate = game.players.find((p) =>
    p.player._id.equals(game.currentRound.associate.id)
  );

  const paralegal = game.players.find((p) =>
    p.player._id.equals(game.currentRound.partner.id)
  );
  if (
    paralegal.role === "Evil" &&
    associate.role === "Evil" &&
    partner.role === "Evil"
  ) {
    game.gameChat.push("entire team is corrupt");
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
      gamechat: game.gameChat,
    });
    game.gameChat.push("honest evidence automatically vetod");
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
      gamechat: game.gameChat,
    });
    game.gameChat.push("corrupt team has won");
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
      gamechat: game.gameChat,
    });
    await transitionPhase(game, "game ended");
    return true;
  }
  return false;
}

async function handleHonestVeto(game, lobbyid) {
  console.log("honest veto function runs");

  const partner = game.players.find((p) =>
    p.player._id.equals(game.currentRound.paralegal.id)
  );
  const associate = game.players.find((p) =>
    p.player._id.equals(game.currentRound.associate.id)
  );

  const paralegal = game.players.find((p) =>
    p.player._id.equals(game.currentRound.partner.id)
  );
  console.log("this is the partners role", partner.role);
  console.log("this is the associate role", associate.role);
  console.log("this is the paralegals role", paralegal.role);
  if (
    paralegal.role === "Good" &&
    associate.role === "Good" &&
    partner.role === "Good"
  ) {
    console.log("all players are good");
    game.gameChat.push("entire team is good");
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
      gamechat: game.gameChat,
    });
    game.gameChat.push("corrupt evidence automatically vetod");
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
      gamechat: game.gameChat,
    });
    console.log("this is the player length:", game.players.length);
    if (game.players.length == 6) {
      game.gameChat.push("honest team has won");
      await triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
        gamechat: game.gameChat,
      });
      await transitionPhase(game, "game ended");
      return true;
    } else {
      game.gameChat.push("Judge needs to pick a new team");
      await triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
        gamechat: game.gameChat,
      });
      await clearRound(game);
      await transitionPhase(game, "Judge Picks Partner");
      return true;
    }
  }
  return false;
}
