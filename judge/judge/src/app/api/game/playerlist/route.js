import { NextResponse } from "next/server";
import connectToDB from "@/lib/utils";
import { Game } from "@/lib/models";

export async function POST(req) {
  try {
    const { lobbyid } = await req.json(); 
    await connectToDB(); 

    const game = await Game.findOne({ gameid: lobbyid }).populate(
      "players.player"
    ); 
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const playerData = game.players.map((p) => ({
      username: p.player.username,
      role: p.role,
    }));
    
    return NextResponse.json({ status: 200, players: playerData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Failed to get players" }, { status: 500 });
  }
}
