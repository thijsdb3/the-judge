import Deck from "@/components/gamelobby/deck/Deck";
import BoardState from "@/components/gamelobby/boardState/BoardState"
import GameChat from "@/components/gamelobby/gameChat/Gamechat";
import PlayerList from "@/components/gamelobby/players/PlayerList";
import styles from "./page.module.css"
import { auth } from "@/lib/auth";

const GamePage = async (context) => {
  const session = await auth(); // Fetch session
  const id = context.params.id; // Get lobby ID from params

  return (
   <div>
      {session ? ( 
        <div className={styles.all}> 
        <div className={styles.container}> 
          <div className={styles.leftpart}>
            <PlayerList lobbyid={id} session={session} />
          </div>
          <div className={styles.rightpart}>
            <div className={styles.section}>
              <Deck />
              <BoardState />
            </div>
            <div className={styles.section}>
              <GameChat/>
            </div>
          </div>
        </div>
        </div>
      ) : (
        <h1 className={styles.title}>Please log in to access the game features.</h1>
      )}
    </div>
  );
};

export default GamePage;
