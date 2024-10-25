import connectToDB from "@/lib/utils";
import { Game } from "@/lib/models";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { lobbyid } = await request.json();

    if (!lobbyid) {
      return NextResponse.json(
        { error: "Lobby ID is required." },
        { status: 400 }
      );
    }

    await connectToDB();

    const game = await Game.findOne({ gameid: lobbyid });

    if (!game) {
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }

    const numberOfReds = game.boardState.reds || 0; 
    const numberOfBlues = game.boardState.blues || 0; 

    return NextResponse.json({  numberOfReds,  numberOfBlues });
  } catch (error) {
    console.error("Error fetching game data:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
