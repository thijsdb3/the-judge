"use client";

import { useState, useEffect } from 'react';
import styles from "./Players.module.css";
import Image from 'next/image';
import { fisherYatesShuffle } from '@/lib/utils';
import { handlePick } from '@/lib/gameround';
import Pusher from "pusher-js";

const Players = ({ lobbyid, session }) => {
  const [players, setPlayers] = useState([]);
  const [currentPlayerRole, setCurrentPlayerRole] = useState(null);
  const [error, setError] = useState(null);
 
  const [playerInvestigating, setPlayerInvestigating] = useState(null);
  const [playerBeingInvestigated, setPlayerBeingInvestigated] = useState(null);
  const [playerReverseInvestigating, setPlayerReverseInvestigating] = useState(null);
  const [playerBeingReverseInvestigated, setPlayerBeingReverseInvestigated] = useState(null);

  const username = session?.user.username;
  const userid = session?.user.id;

  const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: "eu",
  });

  const channel = pusher.subscribe(`gameUpdate-${lobbyid}-${userid}`);

  useEffect(() => { 
    channel.bind("investigation", (data) => {
      setPlayerInvestigating(data.playerInvestigating);   
      setPlayerBeingInvestigated(data.playerBeingInvestigated);
    });

    channel.bind("reverse investigation", (data) => 
      {
    
      setPlayerReverseInvestigating(data.playerReverseInvestigating);   
      setPlayerBeingReverseInvestigated(data.playerBeingReverseInvestigated);
    });
  }, [lobbyid, username]);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!username) return;

      try {
        const res = await fetch('/api/game/playerlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lobbyid }),
        });

        if (res.ok) {
          const data = await res.json();
          const allPlayers = data.players;

          const currentPlayer = allPlayers.find(player => player.username === username);

          if (currentPlayer) {
            setCurrentPlayerRole(currentPlayer.role);
          }

          const judgePlayer = allPlayers.find(player => player.role === "Judge");
          const otherPlayers = allPlayers.filter(player => player.role !== "Judge");
          const shuffledPlayers = fisherYatesShuffle(otherPlayers);
          const orderedPlayers = judgePlayer ? [judgePlayer, ...shuffledPlayers] : shuffledPlayers;
          setPlayers(orderedPlayers);
        } else {
          throw new Error('Failed to fetch players');
        }
      } catch (error) {
        setError('Failed to fetch players');
      }
    };

    fetchPlayers();
  }, [lobbyid, username]);

  const getPlayerStyle = (playerRole, playerUsername) => {
    // Investigation role reveal: investigated player's role shown in blue if good, red if evil
    if (playerBeingInvestigated === playerUsername && playerInvestigating === username) {
      return { color: playerRole === "Good" ? 'blue' : 'red' };
    }
    if (playerUsername === playerReverseInvestigating && playerBeingReverseInvestigated === username) {
      return { color: playerRole === "Good" ? 'blue' : 'red' };
    }

    // Corrupt players see other corrupt players in red
    if (currentPlayerRole === "Evil" && playerRole === "Evil") {
      return { color: 'red' };
    }
    // Good players see their own role in blue
    if (currentPlayerRole === "Good" && playerUsername === username) {
      return { color: 'blue' };
    }

    // Default color for other cases
    return { color: 'black' };
  };

  return (
    <div className={styles.leftpart}>
      <h1 className={styles.title}>Players in Game</h1>
      <ul className={styles.playerlist}>
        {players.map((player, index) => (
          <li
            className={`${styles.playerlistelement} ${styles.myTurn}`}
            key={index}
            style={getPlayerStyle(player.role, player.username)}
            onClick={() => {
              handlePick(player, lobbyid, username);
            }}
          >
            <Image
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

export default Players;
