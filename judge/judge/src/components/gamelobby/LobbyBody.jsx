"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";
import Image from "next/image";
import styles from "./LobbyBoddy.module.css";

const LobbyBody = ({ session, lobbyid }) => {
  const [players, setPlayers] = useState([]);
  const router = useRouter();  // To handle page navigation

  useEffect(() => {
    if (session) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: 'eu',
      });

      const channel = pusher.subscribe(`gameUpdate-${lobbyid}`);
      const userid = session.user.id;

      channel.bind('pusher:subscription_error', (status) => {
        console.error('Pusher subscription error:', status);
      });

      channel.bind('pusher:subscription_succeeded', () => {
        // Notify the server that the user has joined the game
        fetch('/api/playerlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userid, lobbyid, action: 'join' }),
        }).catch((error) => console.error('Error joining game:', error));
      });

      // Update players list when userList event is triggered
      channel.bind('userList', (message) => {
        setPlayers(message.users);
      });

      // Listen for the "game-start" event and redirect all clients to the game page
      channel.bind('game-start', () => {
        router.push(`/game/${lobbyid}`);
      });

      const handleLeave = async () => {
        await fetch('/api/playerlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userid, lobbyid, action: 'leave' }),
        }).catch((error) => console.error('Error leaving game:', error));
      };

      window.addEventListener('beforeunload', handleLeave);

      return () => {
        (async () => {
          await handleLeave();
          window.removeEventListener('beforeunload', handleLeave);
          channel.unbind_all();
          channel.unsubscribe();
        })();
      };
    }    
  }, [session, lobbyid]);

  const canStartGame = players.length >= 0; 

  const handleStartGame = async () => {
    try {
      const response = await fetch('/api/game/initialisation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyid }),
      });

      if (!response.ok) {
        throw new Error('Failed to start the game');
      }
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  };

  return (
    <div >
      <h1 className={styles.title}>Players in Game</h1>
      <ul className={styles.playerlist}>
        {players.map((player, index) => (
          <li
            className={`${styles.playerlistelement} `}
            key={index}
          >
            <Image
              src={player.role === "Judge" ? "/images/judge-icon.png" : "/images/player.png"}
              alt="Player Avatar"
              width={30}
              height={30}
            />
            {player}
          </li>
        ))}
      </ul>
      <button className={styles.button} onClick={handleStartGame} disabled={!canStartGame}>
        Start Game
      </button>
    </div>
  );
};

export default LobbyBody;
