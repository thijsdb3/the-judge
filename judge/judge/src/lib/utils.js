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


export const assignRoles = (shuffledPlayers) => {
  const totalPlayers = shuffledPlayers.length;
  const players = [];

  players.push({ player: shuffledPlayers[0], role: "Judge" });

  let goodCount = 0,
    evilCount = 0,
    blindmanCount = 0;

  switch (totalPlayers) {
    case 4:
      goodCount = 2;
      evilCount = 1;
      break;
    case 5:
      goodCount = 2;
      evilCount = 2;
      break;
    case 6:
      goodCount = 3;
      evilCount = 2;
      break;
    case 7:
      goodCount = 3;
      evilCount = 3;
      break;
    case 8:
      goodCount = 4;
      evilCount = 3;
      break;
    case 9:
      goodCount = 4;
      evilCount = 3;
      blindmanCount = 1;
      break;
    case 10:
      goodCount = 5;
      evilCount = 3;
      blindmanCount = 1;
      break;
    case 11:
      goodCount = 5;
      evilCount = 4;
      blindmanCount = 1;
      break;
    case 12:
      goodCount = 6;
      evilCount = 5;
      blindmanCount = 1;
      break;
    case 13:
      goodCount = 6;
      evilCount = 6;
      blindmanCount = 1;
      break;
    default:
      throw new Error("Unsupported number of players. Supported counts: 4-13.");
  }

  if (blindmanCount > 0) {
    players.push({ player: shuffledPlayers[1], role: "Blindman" });
  }

  for (let i = blindmanCount + 1; i <= blindmanCount + evilCount; i++) {
    players.push({ player: shuffledPlayers[i], role: "Evil" });
  }

  for (let i = blindmanCount + evilCount + 1; i < totalPlayers; i++) {
    players.push({ player: shuffledPlayers[i], role: "Good" });
  }

  return players;
};

export default connectToDB;
