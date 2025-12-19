import connectToDB from "@/lib/utils";
import { Game, GameLobby, User } from "@/lib/models";
import { fisherYatesShuffle, assignRoles } from "@/lib/utils";
import { NextResponse } from "next/server";
import { triggerPusherEvent } from "@/lib/phaseTransition";

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

    const currentRound = {
      judge,
      unselectables: [judge],
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
      gameChat: ["game has started"],
    });

    await newGame.save();

    await triggerPusherEvent(`gameUpdate-${lobbyid}`, "game-start", {
      lobbyid,
    });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.error("Error during game initialization:", error);
    return NextResponse.json(
      { error: "Failed to initialise game" },
      { status: 500 }
    );
  }
}
