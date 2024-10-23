"use client";

import { useState, useEffect } from 'react';
import styles from "./Players.module.css";
import Image from 'next/image';
import { fisherYatesShuffle } from '@/lib/utils';
import { handlePick } from '@/lib/gameround';

const Players = ({ lobbyid, session }) => {
  const [players, setPlayers] = useState([]);
  const [currentPlayerRole, setCurrentPlayerRole] = useState(null);
  const [error, setError] = useState(null);
  const username = session?.user.username;

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



  if (error) return <p>Error: {error}</p>;

  const getPlayerStyle = (playerRole, playerUsername) => {
    if (currentPlayerRole === "Good") {
      return playerUsername === username ? { color: 'blue' } : { color: 'black' };
    } else if (currentPlayerRole === "Evil") {
      return playerRole === "Evil" ? { color: 'red' } : { color: 'black' };
    }
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
