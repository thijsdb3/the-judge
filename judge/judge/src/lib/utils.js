import mongoose from "mongoose";

const connection = {};

const connectToDB = async () => {
  try {
    if (connection.isConnected) {
      return;
    }
    const db = await mongoose.connect(process.env.MONGO);
    connection.isConnected = db.connections[0].readyState;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const reshuffleDeck = (game) => {
  const newDeck = [...game.drawPile, ...game.discardPile];
  game.discardPile = [];
  return shuffle(newDeck);
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



// assigns roles to the players in game 
// randomly selects the judge between players that volunteered if nobody volunteered than it randomly selects between all players
export const assignRoles = (players) => {
  const totalPlayers = players.length;
  const assignedRoles = [];

  const volunteeredPlayers = players.filter((player) => player.judgeFlag);

  // Assign Judge
  let judge;
  if (volunteeredPlayers.length > 0) {
    const judgeIndex = Math.floor(Math.random() * volunteeredPlayers.length);
    judge = volunteeredPlayers[judgeIndex];
  } else {
    const judgeIndex = Math.floor(Math.random() * totalPlayers);
    judge = players[judgeIndex];
  }
  assignedRoles.push({ player: judge.id, role: "Judge" });

  // Prepare remaining players list excluding the judge
  const remainingPlayers = players.filter((player) => player.id !== judge.id);

  let goodCount = 0,
    evilCount = 0,
    blindmanCount = 0;

  // Set counts based on totalPlayers
  switch (totalPlayers) {
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

  // Assign Blindman if applicable
  if (blindmanCount > 0) {
    assignedRoles.push({ player: remainingPlayers[0].id, role: "Blindman" });
    remainingPlayers.shift(); // Remove the assigned player from the list
  }

  // Assign Evil roles
  for (let i = 0; i < evilCount; i++) {
    assignedRoles.push({ player: remainingPlayers[i].id, role: "Evil" });
  }

  // Assign Good roles
  for (let i = evilCount; i < evilCount + goodCount; i++) {
    assignedRoles.push({ player: remainingPlayers[i].id, role: "Good" });
  }

  return assignedRoles;
};



export default connectToDB;
