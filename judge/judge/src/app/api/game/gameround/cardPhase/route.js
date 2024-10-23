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
  const { partner, associate, paralegal } = game.currentRound;

  let userCards =
    userid === associate.id.toString() ? associate.cards : paralegal.cards;

  if (action === "seeCards") {
    await pusher.trigger(`gameUpdate-${lobbyid}-${userid}`, "seeCards", {
      cards: userCards,
    });
    return NextResponse.json({ cards: userCards });
  }

  if (action === "discardCard") {
    if (userid === partner.id.toString()) {
      const remainingCards = userCards.filter(
        (c, i) => i !== userCards.indexOf(card)
      );

      game.discardPile = game.discardPile.concat(remainingCards);

      const { blueCount, redCount } = remainingCards.reduce(
        (counts, card) => {
          if (card === "blue") counts.blueCount += 1;
          else if (card === "red") counts.redCount += 1;
          return counts;
        },
        { blueCount: 0, redCount: 0 }
      );

      if (blueCount > redCount) {
        game.gameChat.push("blue card enacted");
        game.set("boardState.blues", game.boardState.blues + 1);
        await pusher.trigger(`gameUpdate-${lobbyid}`, "gamechat", {
          gamechat: game.gameChat,
        });
        await pusher.trigger(`gameUpdate-${lobbyid}`, "BlueUpdate", {
          bluestate: game.boardState.blues,
        });

        if (game.boardState.blues !== 5) {
          await transitionPhase(game, "Judge Picks Partner");
        } else {
          game.gameChat.push("honest team has won!");
          await pusher.trigger(`gameUpdate-${lobbyid}`, "gamechat", {
            gamechat: game.gameChat,
          });
          await transitionPhase(game, "game ended");
        }
      } else {
        game.set("boardState.reds", game.boardState.reds + 1);
        game.gameChat.push("red card enacted");
        await pusher.trigger(`gameUpdate-${lobbyid}`, "gamechat", {
          gamechat: game.gameChat,
        });
        await pusher.trigger(`gameUpdate-${lobbyid}`, "RedUpdate", {
          redstate: game.boardState.reds,
        });
        switch (game.boardState.reds) {
          case 2:
            await transitionPhase(game, "Peek and Discard");
            break;
          case 5:
            game.gameChat.push("corrupt team has won!");
            await pusher.trigger(`gameUpdate-${lobbyid}`, "gamechat", {
              gamechat: game.gameChat,
            });
            await transitionPhase(game, "game ended");
            break;
          default:
            await clearRound(game);
        }
      }
    } else {
      const remainingCards = userCards.filter(
        (c, i) => i !== userCards.indexOf(card)
      );
      userid === associate.id.toString()
        ? (associate.cards = remainingCards)
        : (paralegal.cards = remainingCards);
      game.discardPile.push(card);
    }

    if (associate.cards?.length === 2 && paralegal.cards?.length === 2) {
      partner.cards = [...associate.cards, ...paralegal.cards];

      await pusher.trigger(
        `gameUpdate-${lobbyid}-${partner.id.toString()}`,
        "receivePartnerCards",
        { cards: partner.cards }
      );
    }
    await game.save();

    return NextResponse.json({ message: "Card discarded successfully" });
  }

  if (action === "peek and discard") {
    const peekedCards = game.currentRound.playerPeeking.cards; // Peek the top two cards

    if (!discardOption) {
      // If no discardOption is provided, just send the peeked cards
      await pusher.trigger(`gameUpdate-${lobbyid}-${userid}`, "peekCards", {
        cards: peekedCards,
      });
      return NextResponse.json({ cards: peekedCards });
    }

    if (discardOption === "discardOne" && card) {
      // Discard one card, return the remaining card to the deck
      const remainingCard = peekedCards.filter(
        (c, i) => i !== userCards.indexOf(card)
      );
      game.drawPile = game.drawPile.push(remainingCard);
      game.discardPile = game.discardPile.push(card);
      pusher.trigger(`gameUpdate-${lobbyid}`, "updateDeckCount", {
        cardsLeft: game.drawPile.length,
      });
      console.log(
        "this is the length of the drawpile after discardOne",
        game.drawPile.length
      );
    } else if (discardOption === "discardNone") {
      game.drawPile = game.drawPile.concat(peekedCards);
      console.log(
        "this is the length of the drawpile after discardNone",
        game.drawPile.length
      );
      pusher.trigger(`gameUpdate-${lobbyid}`, "updateDeckCount", {
        cardsLeft: game.drawPile.length,
      });
    }

    await clearRound(game);
    return NextResponse.json({ message: "Peek and discard completed" });
  }
}

// Function to handle phase transitions
async function transitionPhase(game, newPhase) {
  game.currentRound.phase = newPhase;
  await game.save();
}

async function clearRound(game) {
  game.previousTeam.partner = game.currentRound.partner.id;
  game.currentRound.partner.id = null;

  game.previousTeam.associate = game.currentRound.associate.id;
  game.currentRound.associate.id = null;

  game.previousTeam.paralegal = game.currentRound.paralegal.id;
  game.currentRound.paralegal.id = null;

  game.currentRound.partner.cards = null;
  game.currentRound.associate.cards = null;
  game.currentRound.paralegal.cards = null;

  // Transition to the next phase after clearing the round
  await transitionPhase(game, "Judge Picks Partner");
  pusher.trigger(`gameUpdate-${game.gameid}-${game.currentRound.judge}`,"turn");
}
