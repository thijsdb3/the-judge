import connectToDB, { fisherYatesShuffle } from "@/lib/utils";
import { Game, GameLobby } from "@/lib/models";
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
    const { lobbyid } = await req.json(); // Destructure lobbyid from request body
    await connectToDB(); // Connect to the database

    const gameLobby = await GameLobby.findOne({ gameid: lobbyid }); // Fetch game lobby by lobbyid

    if (!gameLobby) {
      throw new Error("Game lobby not found");
    }

    const shuffledDrawPile = fisherYatesShuffle([
      ...Array(BLUE_CARDS_COUNT).fill("blue"),
      ...Array(RED_CARDS_COUNT).fill("red"),
    ]);
    const shuffledPlayers = fisherYatesShuffle(gameLobby.players);

    const totalPlayers = shuffledPlayers.length;
    const goodCount = Math.ceil((totalPlayers - 1) / 2);

    const players = shuffledPlayers.map((playerId, index) => {
      if (index === 0) {
        return { player: playerId, role: "Judge", teamlocked: false };
      } else if (totalPlayers >= 9 && index === 1) {
        // Assign the Blindman role to the second player if player count is 9 or more
        return { player: playerId, role: "Blindman", teamlocked: false };
      } else if (index <= goodCount) {
        return { player: playerId, role: "Good", teamlocked: false };
      } else {
        return { player: playerId, role: "Evil", teamlocked: false };
      }
    });
    console.log("these are the players", players);

    const currentRound = {
      judge: players.find((p) => p.role === "Judge").player,
      partner: {
        id: null,
        cards: [],
      },
      associate: {
        id: null,
        cards: [],
      },
      paralegal: {
        id: null,
        cards: [],
      },
      playerpeeking: {
        id: null,
        cards: [],
      },
      phase: "Judge Picks Partner",
      completed: false,
    };
    console.log("this is the currentRound", currentRound);
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
    console.log("this is the new game ", newGame);
    
    await newGame.save();

    await pusher.trigger(`gameUpdate-${lobbyid}`, "game-start", { lobbyid });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to initialise game" },
      { status: 500 }
    );
  }
}
