import mongoose from "mongoose";

const connection = {};

const connectToDB = async () => {
  try {
    if (connection.isConnected) {
      //console.log("Using existing connection");
      return;
    }
    const db = await mongoose.connect(process.env.MONGO);
    connection.isConnected = db.connections[0].readyState;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export const fisherYatesShuffle = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const reshuffleDeck = (game) => {
  const newDeck = [...game.drawPile, ...game.discardPile];
  game.discardPile = [];
  return fisherYatesShuffle(newDeck);
};

export const isNotTeamLocked = (game, selectedPlayer, playerCount) => {
  const { previousTeam: Prevteam, currentRound } = game;
  const { partner, associate } = currentRound;

  const previousPlayers = [
    Prevteam.partner,
    Prevteam.associate,
    Prevteam.paralegal,
  ]
    .filter(Boolean)
    .map((p) => p.toString());

  return !(
    ((playerCount === 8 || playerCount === 9) &&
      previousPlayers.includes(partner.id?.toString()) &&
      previousPlayers.includes(associate.id?.toString()) &&
      previousPlayers.includes(selectedPlayer.toString())) ||
    ((playerCount === 10 || playerCount === 11) &&
      previousPlayers.includes(partner.id?.toString()) &&
      previousPlayers.includes(selectedPlayer.toString())) ||
    ((playerCount === 12 || playerCount === 13) &&
      previousPlayers.includes(selectedPlayer.toString()))
  );
};
export const assignRoles = (players) => {
  if (players.length < 6 || players.length > 13) {
    throw new Error("Supported player count: 4-13.");
  }

  const shuffledPlayers = fisherYatesShuffle([...players]);

  const roleCounts = {
 
    6: { good: 3, evil: 2 },
    7: { good: 3, evil: 3 },
    8: { good: 4, evil: 3 },
    9: { good: 4, evil: 4 },
    10: { good: 5, evil: 4 },
    11: { good: 5, evil: 5 },
    12: { good: 6, evil: 5 },
    13: { good: 6, evil: 6 },
  };

  const { good, evil } = roleCounts[players.length];

  // Select judge (prefer volunteers)
  const judge = shuffledPlayers.find(p => p.judgeFlag) || shuffledPlayers[0];
  const remainingPlayers = shuffledPlayers.filter(p => p.id !== judge.id);

  if (remainingPlayers.length < good + evil) {
    throw new Error("Not enough players after judge selection.");
  }

  // Assign roles
  return [
    { player: judge.id, role: "Judge" },
    ...remainingPlayers.slice(0, evil).map(p => ({ player: p.id, role: "Evil" })),
    ...remainingPlayers.slice(evil, evil + good).map(p => ({ player: p.id, role: "Good" }))
  ];
};

export default connectToDB;
