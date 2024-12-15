import { NextResponse } from "next/server";
import connectToDB, { fetchUsername } from "@/lib/utils";
import { Game } from "@/lib/models";
import { setPlayerTurn } from "@/lib/gameround";
import { transitionPhase, clearRound } from "@/lib/gameround";
import { triggerPusherEvent } from "@/lib/pusher";
import { handlePeekAndDiscard } from "@/lib/powers";
import { handleCorruptVeto, handleHonestVeto } from "@/lib/veto";
import { shuffle } from "@/lib/utils";

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

    const blueCount = remainingCards.filter((card) => card == "blue").length;
    const isBlue = blueCount > remainingCards.length / 2;

    if (!isBlue && game.HonestVetoEnabled) {
      if (await handleHonestVeto(game)) {
        return NextResponse.json({ message: "veto used" });
      }
    }

    if (isBlue && game.CorruptVetoEnabled) {
      if (await handleCorruptVeto(game)) {
        return NextResponse.json({ message: "veto used" });
      }
    }
    game.gameChat.push(
      `The remaining cards are: ${remainingCards[0]}, ${remainingCards[1]}, ${remainingCards[2]}`
    );
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
      gamechat: game.gameChat,
    });
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
    await setPlayerTurn(
      game,
      game.players[0].player,
      game.currentRound.paralegal.id
    );

    if (!isBlue && game.boardState.reds === 2) {
      game.unpickablePlayers = [];
      await triggerPusherEvent(`gameUpdate-${lobbyid}`, "termlockUpdate", {
        termlocks: game.unpickablePlayers,
      });
      game.banner = `The Judge should select a player to peek and discard.`;
      await triggerPusherEvent(`gameUpdate-${lobbyid}`, "banner", {
        banner: game.banner,
      });
      await transitionPhase(game, "Peek and Discard");
      return NextResponse.json({
        message: "peek initialised sucesfully",
      });
    } else if (!isBlue && game.boardState.reds === 3 && playercount >= 7) {
      game.unpickablePlayers = [await fetchUsername(game.playerPeeking.id)];
      await triggerPusherEvent(`gameUpdate-${lobbyid}`, "termlockUpdate", {
        termlocks: game.unpickablePlayers,
      });
      game.banner = `The Judge should select a player to investigate.`;
      await triggerPusherEvent(`gameUpdate-${lobbyid}`, "banner", {
        banner: game.banner,
      });
      await transitionPhase(game, "Judge picks investigator");
      return NextResponse.json({ message: "prepped for inv successfully" });
    } else if (!isBlue && game.boardState.reds === 4) {
      game.HonestVetoEnabled = true;
      console.log("honest veto is:", game.HonestVetoEnabled);
      if (playercount >= 9) {
        game.unpickablePlayers = [
          await fetchUsername(game.playerPeeking.id),
          await fetchUsername(game.playerInvestigating),
        ];
        await triggerPusherEvent(
          `gameUpdate-${game.gameid}`,
          "termlockUpdate",
          {
            termlocks: game.unpickablePlayers,
          }
        );
        game.banner = `The Judge should select a player to reverse investigate.`;
        await triggerPusherEvent(`gameUpdate-${lobbyid}`, "banner", {
          banner: game.banner,
        });
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
      console.log("these are the associate user cards", userCards);
      associate.cards = remainingCards;
      console.log("these are the associate remaining cards", remainingCards);
    } else {
      console.log("these are the paralegal user cards", userCards);
      console.log("these are the paralegal remaining cards", remainingCards);
      paralegal.cards = remainingCards;
    }
    game.discardPile.push(card);
  }

  if (associate.cards?.length === 2 && paralegal.cards?.length === 2) {
    partner.cards = shuffle([...associate.cards, ...paralegal.cards]);
    game.banner = `The Partner is discarding a card...`;
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "banner", {
      banner: game.banner,
    });

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

async function checkWinCondition(game, isBlue, lobbyid) {
  if (
    (isBlue && game.boardState.blues === 5) ||
    (!isBlue && game.boardState.reds === 5)
  ) {
    const winningMessage = isBlue
      ? "honest team has won!"
      : "corrupt team has won!";
    game.gameChat.push(winningMessage);
    game.banner = "winningMessage";
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "gamechat", {
      gamechat: game.gameChat,
    });
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "banner", {
      banner: game.banner,
    });
    await transitionPhase(game, "game ended");
    return true;
  }
  return false;
}
