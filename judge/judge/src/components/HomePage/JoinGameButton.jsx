"use client"
import styles from "./JoinGameButton.module.css";
import { handleJoinGame } from "@/lib/gameid";
import { useRouter } from "next/navigation";

const JoinGameButton = () => {
  const router = useRouter()
  return (
    <button onClick={() => handleJoinGame(router)} className={styles.button}>
      Join Game
    </button>
  );
};

export default JoinGameButton;