import { NextResponse } from "next/server";
import Pusher from "pusher";
import connectToDB from "@/lib/utils";
import { GameLobby } from "@/lib/models";

const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET } = process.env;

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: NEXT_PUBLIC_PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: "mt1",
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
        { $addToSet: { players: { id: userid, judgeFlag: false } } }
      );
    } else if (action === "volunteer") {
      await GameLobby.updateOne(
        { gameid: lobbyid, "players.id": userid },
        { $set: { "players.$.judgeFlag": true } }
      );
    } else if (action === "leave") {
      await GameLobby.updateOne(
        { gameid: lobbyid },
        { $pull: { players: { id: userid } } }
      );
    }
    await gameLobby.save();
    const updatedLobby = await GameLobby.findOne({ gameid: lobbyid }).populate(
      "players.id"
    );

    await pusher.trigger(`gameUpdate-${lobbyid}`, "userList", {
      users: updatedLobby.players.map((player) => player.id.username),
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
