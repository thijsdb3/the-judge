"use client"
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";
import Image from "next/image";
import styles from "./LobbyBoddy.module.css";

const LobbyBody = ({ session, lobbyid }) => {
  const [players, setPlayers] = useState([]);
  const router = useRouter();
  
  const updatePlayerStatus = async (action) => {
    try {
      await fetch('/api/playerlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid : session?.user.id, lobbyid, action }),
      });
    } catch (error) {
      console.error(`Error ${action}ing game:`, error);
    }
  };

  useEffect(() => {
    if (!session) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: 'eu' });
    const channel = pusher.subscribe(`gameUpdate-${lobbyid}`);

    channel.bind('pusher:subscription_error', (status) => {
      console.error('Pusher subscription error:', status);
    });

    channel.bind('pusher:subscription_succeeded', () => updatePlayerStatus('join'));

    // Debounced update to avoid flickering
    const debouncedUpdatePlayers = (newPlayers) => {
      setPlayers((prevPlayers) => {
        if (JSON.stringify(prevPlayers) !== JSON.stringify(newPlayers)) {
          return newPlayers;
        }
        return prevPlayers;
      });
    };

    channel.bind('userList', (message) => {
      debouncedUpdatePlayers(message.users);
    });

    channel.bind('game-start', () => {
      router.push(`/game/${lobbyid}`);
    });

    const handleBeforeUnload = () => updatePlayerStatus('leave');
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [session, lobbyid, router]);

  const handleStartGame = useCallback(async () => {
    try {
      const response = await fetch('/api/game/initialisation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyid }),
      });
      if (!response.ok) throw new Error('Failed to start the game');
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }, [lobbyid]);

  return (
    <div>
      <h1 className={styles.title}>Players in Game</h1>
      <ul className={styles.playerlist}>
        {players.map((player, index) => (
          <li key={index} className={styles.playerlistelement}>
            <Image
              src={"/images/player.png"}
              alt="Player Avatar"
              width={30}
              height={30}
            />
            {player}
          </li>
        ))}
      </ul>
      <button className={styles.button} onClick={handleStartGame} disabled={players.length < 1}>
        Start Game
      </button>
    </div>
  );
};

export default LobbyBody;
