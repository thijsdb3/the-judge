import { NextResponse } from "next/server";
import connectToDB from "@/lib/utils";
import { Game } from "@/lib/models";

export async function POST(req) {
  try {
    const { lobbyid, playerUsername } = await req.json();

    console.log("this is the player username", playerUsername);
    if (!lobbyid || !playerUsername) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDB();

    const game = await Game.findOne({ gameid: lobbyid }).populate(
      "players.player"
    );

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const player = game.players.find(
      (p) => p.player.username == playerUsername
    );

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    const roleColor = player.role === "Good" ? "blue" : "red";
    console.log(roleColor);
    return NextResponse.json({
      roleColor,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
