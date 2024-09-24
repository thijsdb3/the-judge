"use client";

import { useRouter } from 'next/navigation';
import styles from "./homebody.module.css";
import { useState } from "react";

export function generateRandomPath() {
  return Math.floor(Math.random() * 100000000).toString();
}

const HomeBody = () => {
  const router = useRouter();
  const [id, setId] = useState(null);

  const handleMakeGame = () => {
    const newId = generateRandomPath();
    setId(newId);
    router.push(`/gamelobby/${newId}`);
  };

  const handleJoinGame = () => {
    const input = prompt("Enter the Game ID to join:");
    if ( id === input) {
      router.push(`/gamelobby/${input}`);
    } else {
      alert("The Game ID you entered is invalid or does not match.");
    }
  };

  return (
    <div className={styles.container}>
      <button onClick={handleMakeGame} className={styles.button}>
        Make Game
      </button>
      <button onClick={handleJoinGame} className={styles.button}>
        Join Game
      </button>
    </div>
  );
};

export default HomeBody;
