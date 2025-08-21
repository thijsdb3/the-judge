"use client";
import { useRouter } from "next/navigation";
import styles from "./HomePage.module.css";
import { handleJoinGame, handleMakeGame } from "@/lib/gameid";

const HomePage = () => {
  const router = useRouter();

  return (
    <div className={styles.container}>
        <h1 className={styles.title}>The Judge</h1>

        <section className={styles.section}>
          <p>
            An innocent man is on trial for murder. The murderer has hired a team of corrupted
            lawyers determined to see the innocent man found guilty. The Judge is a social
            deduction game where one brave player tests their social reads and logical prowess
            to solve the case.
          </p>
        </section>

        <section className={styles.section}>
          <p>
            One player assumes the role of the Judge and must determine who among the legal staff
            presents honest evidence and who has been corrupted and presents corrupted evidence.
            With enough honest evidence presented, the case will be solved correctly. However,
            with enough corrupt evidence presented, the truth will be lost…
          </p>
        </section>

        <div className={styles.buttonGroup}>
          <button onClick={() => handleMakeGame(router)} className={styles.button}>
            Make Game
          </button>
          <button onClick={() => handleJoinGame(router)} className={styles.button}>
            Join Game
          </button>
        </div>
      </div>
  );
};

export default HomePage;
