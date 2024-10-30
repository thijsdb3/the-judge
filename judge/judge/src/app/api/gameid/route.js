import connectToDB from "@/lib/utils";
import { GameLobby } from "@/lib/models";
import { getGameLobbies } from "@/lib/data";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectToDB();

  try {
    const newGameLobby = new GameLobby({
      players: [],
    });
    console.log(newGameLobby);
    const savedLobby = await newGameLobby.save();

    return NextResponse.json({ gameid: savedLobby.gameid });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  await connectToDB();
  const id = new URL(req.url).searchParams.get("id");

  if (id) {
    try {
      const gameExists = await GameLobby.exists({ gameid: id });
      return NextResponse.json({ exists: !!gameExists });
    } catch (error) {
      console.error("Error checking game ID:", error);
      return NextResponse.json(
        { error: "Failed to check game ID" },
        { status: 500 }
      );
    }
  } else {
    try {
      const gamelobbies = await getGameLobbies();
      return NextResponse.json(gamelobbies);
    } catch (error) {
      console.error("Error fetching game IDs:", error);
      return NextResponse.json(
        { error: "Failed to fetch game IDs" },
        { status: 500 }
      );
    }
  }
}
