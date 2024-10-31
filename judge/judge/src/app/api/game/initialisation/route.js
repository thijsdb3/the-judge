import connectToDB from "@/lib/utils";
import { Game, GameLobby } from "@/lib/models";
import { fisherYatesShuffle, assignRoles } from "@/lib/utils";
import Pusher from "pusher";
import { NextResponse } from "next/server";

const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET } = process.env;

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: NEXT_PUBLIC_PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: "eu",
});

const BLUE_CARDS_COUNT = 12;
const RED_CARDS_COUNT = 22;

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
    const shuffledPlayers = fisherYatesShuffle(gameLobby.players);
    const players = assignRoles(shuffledPlayers);

    const currentRound = {
      judge: players.find((p) => p.role === "Judge").player,
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


    await newGame.save();

    await pusher.trigger(`gameUpdate-${lobbyid}`, "game-start", { lobbyid });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.error("Error during game initialization:", error);
    return NextResponse.json(
      { error: "Failed to initialise game" },
      { status: 500 }
    );
  }
}
