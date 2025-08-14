import connectToDB from "@/lib/utils";
import { Game, GameLobby, User } from "@/lib/models";
import { fisherYatesShuffle, assignRoles } from "@/lib/utils";
import Pusher from "pusher";
import { NextResponse } from "next/server";

const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET } = process.env;

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: NEXT_PUBLIC_PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: "mt1",
});

const BLUE_CARDS_COUNT = 9;
const RED_CARDS_COUNT = 16;

export async function POST(req) {
  try {
    const { lobbyid } = await req.json();
    await connectToDB();

    const gameLobby = await GameLobby.findOne({ gameid: lobbyid });
    if (!gameLobby) {
      throw new Error("Game lobby not found");
    }

    const shuffledDrawPile = fisherYatesShuffle([
      ...Array(BLUE_CARDS_COUNT).fill("blue"),
      ...Array(RED_CARDS_COUNT).fill("red"),
    ]);
    const players = assignRoles(gameLobby.players);

    const judge = players.find((p) => p.role === "Judge").player;
    const judgeUser = await User.findById(judge).select("username");
    console.log(judgeUser);
    const currentRound = {
      judge,
      partner: { id: null, cards: [] },
      associate: { id: null, cards: [] },
      paralegal: { id: null, cards: [] },
      playerPeeking: { id: null, cards: [] },
      phase: "Judge Picks Partner",
    };

    const previousTeam = {
      partner: null,
      associate: null,
      paralegal: null,
    };

    const newGame = new Game({
      gameid: lobbyid,
      players,
      boardState: { reds: 0, blues: 0 },
      drawPile: shuffledDrawPile,
      discardPile: [],
      currentRound,
      previousTeam,
      gameChat: ["Welcome to the Game!"],
    });
    newGame.currentRound.unselectables = [judge];

    await newGame.save();

    await pusher.trigger(`gameUpdate-${lobbyid}`, "game-start", { lobbyid });

    await pusher.trigger(
      `gameUpdate-${lobbyid}-${judge.toString()}`,
      "pickUpdate",
      {
        myTurn: true,
        unselectables: [judgeUser.username],
      }
    );

    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.error("Error during game initialization:", error);
    return NextResponse.json(
      { error: "Failed to initialise game" },
      { status: 500 }
    );
  }
}
