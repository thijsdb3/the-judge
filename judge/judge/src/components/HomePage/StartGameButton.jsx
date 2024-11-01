
"use client"
import styles from "./StartGameButton.module.css";
import { handleMakeGame } from "@/lib/gameid";
import { useRouter } from "next/navigation";

const MakeGameButton = () => {
  const router = useRouter()
  return (
    <button onClick={() => handleMakeGame(router)} className={styles.button}>
      Make Game
    </button>
  );
};

export default MakeGameButton;