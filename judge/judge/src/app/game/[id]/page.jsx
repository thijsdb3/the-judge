import Deck from "@/components/game/deck/Deck";
import Players from "@/components/game/players/Players"
import BoardState from "@/components/game/boardState/BoardState"
import Gamechat from "@/components/game/gamechat/Gamechat";
import styles from "./page.module.css"
import { auth } from "@/lib/auth";
const Game = async (context) => {
  const session = await auth()
  const id = context.params.id
  return (
    <div classame = {styles.all}>
    {session ? ( 
      <div className = {styles.container }> 
       <div className = {styles.leftpart} >
       <Players lobbyid = {id} session = {session} />
       </div>
       <div className = {styles.rightpart}>
        <div className ={styles.section}>
       <Deck lobbyid = {id} session = {session}/>
       <BoardState lobbyid = {id}/>
       </div>
       <div className ={styles.section}>
       <Gamechat lobbyid={id}/>
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
 