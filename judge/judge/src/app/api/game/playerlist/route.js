import connectToDB from "@/lib/utils";
import { Game } from "@/lib/models";

export async function POST(req) {
  try {
    const { lobbyid } = await req.json(); // Destructure lobbyid from request body
    await connectToDB(); // Connect to the database

    const game = await Game.findOne({ gameid: lobbyid }).populate(
      "players.player"
    ); // Populate player details from User model

    if (!game) {
      throw new Error("Game not found");
    }

    // Extract usernames from the populated players
    const playerData = game.players.map((p) => ({
      username: p.player.username,
      role: p.role,
    }));
    
    return new Response(JSON.stringify({ status: 200, players: playerData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to get players" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
