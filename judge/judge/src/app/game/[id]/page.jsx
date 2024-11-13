import StaticDeck from "@/components/game/deck/StaticDeck";
import StaticPlayers from "@/components/game/players/StaticPlayers"
import StaticBoardState from "@/components/game/boardState/StaticBoardState"
import GameChat from "@/components/game/gameChat/Gamechat";
import styles from "./page.module.css"
import { auth } from "@/lib/auth";

const Game = async (context) => {
  const session = await auth()
  const id = context.params.id
  return (
    <div className = {styles.all}>
    {session ? ( 
      <div className = {styles.container }> 
       <div className = {styles.leftpart} >
       <StaticPlayers lobbyid = {id} session = {session} />
       </div>
       <div className = {styles.rightpart}>
        <div className ={styles.section}>
       <StaticDeck lobbyid = {id} session = {session}/>
       <StaticBoardState lobbyid = {id}/>
       </div>
       <div className ={styles.section}>
       <GameChat lobbyid={id}/>
       </div>
       </div>
       </div>
       ) : (
        <h1 className={styles.title}>Please log in to access the game features.</h1>
      )}
    </div>
    
  );
};

export default Game;
 