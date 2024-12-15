import { Game } from "@/lib/models";
import Banner from "./Banner";
import connectToDB from "@/lib/utils";
import InteractivePlayers from "./InteractivePlayers";
import Image from "next/image";
import styles from "./Players.module.css";

const StaticPlayers = async ({ lobbyid, session }) => {
  await connectToDB();

  const game = await Game.findOne({ gameid: lobbyid }).populate("players.player");
  if (!game) return <h1>Error: Game not found</h1>;

  const { players: allPlayers } = game;
  const currentPlayer = allPlayers.find((p) => p.player.username === session?.user.username);

  const getPlayerUsername = (playerId) => 
    allPlayers.find((p) => p.player._id.toString() === playerId?.toString())?.player.username || "None";

  const initialInvestigationState = {
    investigatingUsername: getPlayerUsername(game.playerInvestigating),
    beingInvestigatedUsername: getPlayerUsername(game.playerBeingInvestigated),
    reverseInvestigatingUsername: getPlayerUsername(game.playerReverseInvestigating),
    beingReverseInvestigatedUsername: getPlayerUsername(game.playerBeingReverseInvestigated),
  };

  const playerData = allPlayers.map((p) => ({
    username: p.player.username,
    color: determinePlayerColor(currentPlayer, p),
    myTurn: p.isOnTurn,
  }));

  return (
    <div>
      <Banner  banner = {game.banner}  lobbyid={lobbyid}/>
      <ul className={styles.playerlist}>
        <li className={styles.playerlistelement} style={{ color: "black" }}>
          <Image
            src="/images/judge-icon.png"
            alt="Player Avatar"
            width={30}
            height={30}
          />
          {allPlayers[0]?.player.username}
        </li>
        <InteractivePlayers
          players={playerData}
          lobbyid={lobbyid}
          session={session}
          initialInvestigationState={initialInvestigationState}
          Termlocks = {game.unpickablePlayers}
        />
      </ul>
    </div>
  );
};

const determinePlayerColor = (currentPlayer, p) => {
  if (!currentPlayer) return "black";
  const { role } = currentPlayer;
  const isCurrentUser = p.player.username === currentPlayer.player.username;

  if (role === "Evil" && p.role === "Evil") return "red";
  if (role === "Evil" && p.role === "Good") return "black";
  if (role === "Good" && isCurrentUser) return "blue";

  return "black";
};




export default StaticPlayers;
