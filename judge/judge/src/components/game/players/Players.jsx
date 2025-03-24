"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import styles from "./Players.module.css";
import Image from 'next/image';
import { fisherYatesShuffle } from '@/lib/utils';
import { handlePick } from '@/lib/gameround';
import Pusher from "pusher-js";

const Players = ({ lobbyid, session }) => {
  const [players, setPlayers] = useState([]);
  const [currentPlayerRole, setCurrentPlayerRole] = useState(null);
  const [investigationState, setInvestigationState] = useState({
    playerInvestigating: null,
    playerBeingInvestigated: null,
    playerReverseInvestigating: null,
    playerBeingReverseInvestigated: null,
  });

  const username = session?.user.username;
  const userid = session?.user.id;

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: "mt1" });
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
  }, [lobbyid, userid]);

  const fetchPlayers = useCallback(async () => {
    if (!username) return;

    try {
      const res = await fetch('/api/game/playerlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyid }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch players');
      }
      
      const data = await res.json();
      const allPlayers = data.players;

      const currentPlayer = allPlayers.find(player => player.username === username);
      setCurrentPlayerRole(currentPlayer?.role);

      const judgePlayer = allPlayers.find(player => player.role === "Judge");
      const otherPlayers = allPlayers.filter(player => player.role !== "Judge");
      const orderedPlayers = judgePlayer ? [judgePlayer, ...fisherYatesShuffle(otherPlayers)] : fisherYatesShuffle(otherPlayers);

      setPlayers(orderedPlayers);
    } catch(err) {
      console.log(err)
    }
  }, [lobbyid, username]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const getPlayerStyle = useCallback((playerRole, playerUsername) => {
    const { playerBeingInvestigated, playerInvestigating, playerReverseInvestigating, playerBeingReverseInvestigated } = investigationState;

    if (playerBeingInvestigated === playerUsername && playerInvestigating === username) {
      return { color: playerRole === "Good" ? 'blue' : 'red' };
    }
    if (playerUsername === playerReverseInvestigating && playerBeingReverseInvestigated === username) {
      return { color: playerRole === "Good" ? 'blue' : 'red' };
    }

    if (currentPlayerRole === "Evil" && playerRole === "Evil") return { color: 'red' };
    if (currentPlayerRole === "Good" && playerUsername === username) return { color: 'blue' };

    return { color: 'black' };
  }, [currentPlayerRole, investigationState, username]);

  return (
    <div>
      <h1 className={styles.title}>Players in Game</h1>
      <ul className={styles.playerlist}>
        {players.map((player, index) => (
          <li
            className={`${styles.playerlistelement} ${styles.myTurn}`}
            key={index}
            style={getPlayerStyle(player.role, player.username)}
            onClick={() => handlePick(player, lobbyid, username)}
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
