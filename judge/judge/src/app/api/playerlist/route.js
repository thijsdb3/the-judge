import { NextResponse } from "next/server";
import Pusher from "pusher";
import connectToDB from "@/lib/utils";
import { GameLobby } from "@/lib/models";

const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET } = process.env;

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: NEXT_PUBLIC_PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: "eu",
});

export async function POST(req) {
  try {
    const { userid, lobbyid, action } = await req.json();
    await connectToDB();

    const gameLobby = await GameLobby.findOne({ gameid: lobbyid });

    if (!gameLobby) {
      return NextResponse.json(
        { error: "Game lobby not found" },
        { status: 404 }
      );
    }

    if (action === "join") {
      await GameLobby.updateOne(
        { gameid: lobbyid },
        { $addToSet: { players: userid } } 
      );
    } else if (action === "leave") {
      await GameLobby.updateOne(
        { gameid: lobbyid },
        { $pull: { players: userid } } 
      );
    }

    await gameLobby.save();
    const updatedLobby = await GameLobby.findOne({ gameid: lobbyid }).populate("players");


    // Trigger an update to all clients with the updated list of players
    await pusher.trigger(`gameUpdate-${lobbyid}`, "userList", {
      users: updatedLobby.players.map((player) => player.username), // Send the updated user list
    });

    return NextResponse.json(
      { message: `User ${action}ed successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating player list:", error);
    return NextResponse.json(
      { error: "Failed to update player list" },
      { status: 500 }
    );
  }
}
