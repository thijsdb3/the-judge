import mongoose from "mongoose";
import { User } from "./models";
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

  const volunteeredPlayers = players.filter(player => player.judgeFlag);

  const judge = volunteeredPlayers.length
    ? volunteeredPlayers[Math.floor(Math.random() * volunteeredPlayers.length)]
    : players[Math.floor(Math.random() * totalPlayers)];

  assignedRoles.push({ player: judge.id, role: "Judge" });

  const remainingPlayers = players.filter(player => player.id !== judge.id);

  const evilCount = Math.floor((totalPlayers - 1) / 2); 
  const goodCount = totalPlayers - 1 - evilCount; 

  assignedRoles.push(...remainingPlayers.slice(0, evilCount).map(player => ({ player: player.id, role: "Evil" })));

  assignedRoles.push(...remainingPlayers.slice(evilCount, evilCount + goodCount).map(player => ({ player: player.id, role: "Good" })));

  return assignedRoles;
};

export const fetchUsername = async (userid) => {
  try {
    const userInQuestion = await User.findById(userid);
    return userInQuestion ? userInQuestion.username : null;
  } catch (error) {
    console.error("Error fetching username:", error);
    return null;
  }
};

export default connectToDB;
