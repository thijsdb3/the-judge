"use client";
import { useState, useEffect, useCallback,memo } from 'react';
import Pusher from "pusher-js";
import { handlePick } from '@/lib/gameround';
import styles from "./Players.module.css";


const InteractivePlayers =  ({ players, lobbyid, session }) => {

  if (!players || !session) {
    return <div>Loading...</div>; 
  }
  const username = session?.user.username;
  const userid = session?.user.id;
  const currentPlayer = players?.find(player => player.username === username);

  const [investigationState, setInvestigationState] = useState({
    playerInvestigating: null,
    playerBeingInvestigated: null,
    playerReverseInvestigating: null,
    playerBeingReverseInvestigated: null,
  });

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: "eu" });
    const channel = pusher.subscribe(`gameUpdate-${lobbyid}-${userid}`);
    
    const handleInvestigation = (data) => {
      setInvestigationState(prevState => ({
        ...prevState,
        playerInvestigating: data.playerInvestigating,
        playerBeingInvestigated: data.playerBeingInvestigated,
      }));
    };

    const handleReverseInvestigation = (data) => {
      setInvestigationState(prevState => ({
        ...prevState,
        playerReverseInvestigating: data.playerReverseInvestigating,
        playerBeingReverseInvestigated: data.playerBeingReverseInvestigated,
      }));
    };

    channel.bind("investigation", handleInvestigation);
    channel.bind("reverse investigation", handleReverseInvestigation);

    return () => {
      channel.unbind("investigation", handleInvestigation);
      channel.unbind("reverse investigation", handleReverseInvestigation);
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  const getPlayerStyle = useCallback((playerRole, playerUsername) => {
    const { playerBeingInvestigated, playerInvestigating, playerReverseInvestigating, playerBeingReverseInvestigated } = investigationState;

    if (playerBeingInvestigated === playerUsername && playerInvestigating === username) {
      return { color: playerRole === "Good" ? 'blue' : 'red' };
    }
    if (playerUsername === playerReverseInvestigating && playerBeingReverseInvestigated === username) {
      return { color: playerRole === "Good" ? 'blue' : 'red' };
    }

    if (currentPlayer.role === "Evil" && playerRole === "Evil") return { color: 'red' };
    if (currentPlayer.role === "Evil" && playerRole === "Good") return { color: 'black' };
    if (currentPlayer.role === "Blindman" && playerUsername === username) return { color: '#8B0000' };
    if (currentPlayer.role === "Good" && playerUsername === username) return { color: 'blue' };
    if (currentPlayer.role === "Evil" && playerRole === "Blindman") return { color: '#8B0000' };

    return { color: 'black' };
  },[currentPlayer.role,investigationState]);

  return (
    <div>
      <h1 className = {styles.title}> Players in Game</h1>
      <ul className={styles.playerlist}>
        {players?.map((player, index) => (
          <li
            className={`${styles.playerlistelement} ${styles.myTurn}`}
            key={index}
            style={getPlayerStyle(player.role, player.username)}
            onClick={() => handlePick(player, lobbyid, username)}
          >
            <img
              src={player.role === "Judge" ? "/images/judge-icon.png" : "/images/player.png"}
              alt="Player Avatar"
              width={30}
              height={30}
            />
            {player.username}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default memo(InteractivePlayers);
