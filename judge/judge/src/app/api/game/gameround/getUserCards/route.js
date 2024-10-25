import connectToDB from "@/lib/utils";
import { Game } from "@/lib/models";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { userid, lobbyid } = await request.json();
  await connectToDB();
  const game = await Game.findOne({ gameid: lobbyid });

  let userCards = [];
  let phase = game?.currentRound?.phase || "unstarted"; // Default to "unstarted" if phase is not defined
  let playerPeeking = false;
  const cardsleft = game.drawPile.length;
  try {
    switch (userid) {
      case game.currentRound.partner.id?.toString():
        userCards = userCards.concat(game.currentRound.partner.cards || []);
        break;

      case game.currentRound.associate.id?.toString():
        userCards = userCards.concat(game.currentRound.associate.cards || []);
        break;

      case game.currentRound.paralegal.id?.toString():
        userCards = userCards.concat(game.currentRound.paralegal.cards || []);
        break;

      case game.currentRound.playerPeeking.id?.toString():
        userCards = userCards.concat(
          game.currentRound.playerPeeking.cards || []
        );
        playerPeeking = true;
        break;

      default:
        break;
    }
    console.log("these are the userCards", userCards);
    console.log("this is the phase", phase);
    return NextResponse.json({
      cards: userCards,
      phase,
      playerPeeking,
      cardsleft,
    });
  } catch (error) {
    console.error("Error fetching user cards:", error);
    return NextResponse.json({
      cards: [],
      phase: "unstarted",
      playerPeeking: false,
      cardsleft: 33,
    });
  }
}
