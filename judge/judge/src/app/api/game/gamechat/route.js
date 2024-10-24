import { Game } from "@/lib/models";
import connectToDB from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectToDB();

  try {
    const { lobbyid } = await req.json(); // Extract lobbyid from the request body

    const game = await Game.findOne({ gameid: lobbyid });

    if (game) {
      return NextResponse.json({ messages: game.gameChat }, { status: 200 });
    } else {
      return NextResponse.json({ messages: [] }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching game chat messages:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}
