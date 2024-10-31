import Deck from "@/components/game/deck/Deck";
import BoardState from "@/components/game/boardState/BoardState"
import Gamechat from "@/components/game/gamechat/Gamechat";
import LobbyBody from "@/components/gamelobby/LobbyBody";
import styles from "./page.module.css"
import { auth } from "@/lib/auth";
const GamePage = async (context) => {
  const session = await auth()
  const id = context.params.id
  return (
    <div classame = {styles.all}>
      <div className = {styles.container }> 
       <div className = {styles.leftpart} >
       {session ? (
            <LobbyBody lobbyid={id} session={session} />
          ) : (
            <h1 className = {styles.title}>Please log in to access the lobby.</h1>
          )}
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
       
    </div>
    
  );
};

export default GamePage;
 

