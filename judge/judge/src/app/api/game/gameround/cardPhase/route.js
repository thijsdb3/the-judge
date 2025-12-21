import { NextResponse } from "next/server";
import connectToDB, { fisherYatesShuffle, pushGameChat } from "@/lib/utils";
import { Game } from "@/lib/models";
import { transitionPhase } from "@/lib/phaseTransition";
import { triggerPusherEvent } from "@/lib/phaseTransition";
import { resetRoundAndTransition } from "@/lib/roundUtils";
import {
  handleSpecialPowers,
  handleVetoIfApplicable,
  handlePeekDecision,
} from "@/lib/specialPowers";

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
      return handlePeekDecision(game, discardOption, card, lobbyid);
    default:
      return NextResponse.json(
        { error: "Invalid action specified." },
        { status: 400 }
      );
  }
}

async function handleSeeCards(game, userCards, lobbyid, userid) {
  game.currentRound.phase = "seeCards";
  await triggerPusherEvent(`gameUpdate-${lobbyid}-${userid}`, "seeCards", {
    cards: userCards,
  });
  return NextResponse.json({ cards: userCards });
}

async function handleDiscardCard(game, userid, userCards, card, lobbyid) {
  game.currentRound.phase = "discardCard";
  const remainingCards = removeOneCard(userCards, card);

  const isPartner = userid === game.currentRound.partner.id?.toString();

  if (!isPartner) {
    await discardByNonPartner(game, userid, remainingCards, card);
  } else {
    const result = await discardByPartner(game, remainingCards, lobbyid);
    if (result?.earlyExit) {
      return NextResponse.json(result.response);
    }
  }

  await maybeDealPartnerCards(game, lobbyid);
  await game.save();

  return NextResponse.json({ message: "Card discarded successfully" });
}

async function discardByNonPartner(game, userid, remainingCards, card) {
  const { associate, paralegal } = game.currentRound;

  if (userid === associate.id.toString()) {
    associate.cards = remainingCards;
  } else {
    paralegal.cards = remainingCards;
  }

  game.discardPile.push(card);
}
async function discardByPartner(game, remainingCards, lobbyid) {
  game.discardPile.push(...remainingCards);

  await pushGameChat(
    game,
    lobbyid,
    `Remaining cards: ${remainingCards.join(", ")}`
  );

  const isBlue = resolvePolicy(remainingCards);

  if (await handleVetoIfApplicable(game, isBlue, lobbyid)) {
    return { earlyExit: true, response: { message: "veto used" } };
  }

  await enactPolicy(game, isBlue, lobbyid);

  if (await checkWinCondition(game, isBlue, lobbyid)) {
    return {
      earlyExit: true,
      response: { message: "game played successfully" },
    };
  }

  const powerHandled = await handleSpecialPowers(game, isBlue);
  if (powerHandled) return;

  await resetRoundAndTransition(game, "Judge Picks Partner");
  return null;
}

async function enactPolicy(game, isBlue, lobbyid) {
  game.boardState[isBlue ? "blues" : "reds"] += 1;

  const message = isBlue
    ? "honest evidence enacted!"
    : "corrupt evidence enacted!";

  await Promise.all([
    pushGameChat(game, lobbyid, message),
    triggerPusherEvent(
      `gameUpdate-${lobbyid}`,
      `${isBlue ? "Blue" : "Red"}Update`,
      {
        [`${isBlue ? "bluestate" : "redstate"}`]:
          game.boardState[isBlue ? "blues" : "reds"],
      }
    ),
  ]);
}

async function maybeDealPartnerCards(game, lobbyid) {
  const { associate, paralegal, partner } = game.currentRound;

  if (associate.cards?.length === 2 && paralegal.cards?.length === 2) {
    partner.cards = fisherYatesShuffle([
      ...associate.cards,
      ...paralegal.cards,
    ]);

    game.currentRound.phase = "seeCards";

    await game.save();
    await triggerPusherEvent(
      `gameUpdate-${lobbyid}-${partner.id}`,
      "seeCards",
      {
        cards: partner.cards,
      }
    );
  }
}

async function checkWinCondition(game, isBlue, lobbyid) {
  if (
    (isBlue && game.boardState.blues === 5) ||
    (!isBlue && game.boardState.reds === 5)
  ) {
    const winningMessage = isBlue
      ? "honest team has won!"
      : "corrupt team has won!";

    await pushGameChat(game, lobbyid, winningMessage);
    await transitionPhase(game, "game ended");
    return true;
  }
  return false;
}

function removeOneCard(cards, card) {
  const index = cards?.indexOf(card);
  if (index === -1) return [...cards];
  return cards.filter((_, i) => i !== index);
}

function resolvePolicy(cards) {
  const blueCount = cards.filter((c) => c === "blue").length;
  return blueCount > cards.length / 2;
}
