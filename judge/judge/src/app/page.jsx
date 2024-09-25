"use client";
import { useRouter } from 'next/navigation'
import styles from "./HomePage.module.css";
import { handleJoinGame,handleMakeGame } from "@/lib/gameid";


const HomePage = () => {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <button onClick={() => handleMakeGame(router)} className={styles.button}>
        Make Game
      </button>
      <button onClick={() => handleJoinGame(router)} className={styles.button}>
        Join Game
      </button>
    </div>
  );
};


export default HomePage;