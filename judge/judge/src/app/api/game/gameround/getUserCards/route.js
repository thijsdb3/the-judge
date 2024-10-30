import connectToDB from "@/lib/utils";
import { Game } from "@/lib/models";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userid, lobbyid } = await request.json();

    await connectToDB();
    const game = await Game.findOne({ gameid: lobbyid });

    if (!game) {
      return NextResponse.json({ error: "no game found" }, { status: 400 });
    }

    let userCards = [];
    let phase = game.currentRound.phase || "unstarted";
    let playerPeeking = false;
    const cardsleft = game.drawPile.length;

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

    return NextResponse.json({
      cards: userCards,
      phase,
      playerPeeking,
      cardsleft,
    });
  } catch (error) {
    console.error("Error fetching user cards:", error);

    return NextResponse.json(
      {
        cards: [],
        phase: "unstarted",
        playerPeeking: false,
        cardsleft: 33,
      },
      { status: 500 }
    );
  }
}
