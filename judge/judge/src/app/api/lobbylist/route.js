import { NextResponse } from "next/server";
import connectToDB from "@/lib/utils";
import { GameLobby } from "@/lib/models";
import { triggerPusherEvent } from "@/lib/pusher";

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

    console.log("this is the action on userlist", action);

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

    const uniquePlayers = Array.from(
      new Map(
        updatedLobby.players.map((player) => [player.id.toString(), player])
      ).values()
    );

    console.log("Preparing to send userList event", {
      users: uniquePlayers.map((player) => player.id.username),
    });
    console.log(
      "Triggering userList event with users:",
      uniquePlayers.map((player) => player.id.username)
    );
    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "userList", {
      users: uniquePlayers.map((player) => player.id.username),
    });
    console.log("userList event sent to Pusher");

    return NextResponse.json(
      { message: `User ${action}ed successfully`, players: uniquePlayers },
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
