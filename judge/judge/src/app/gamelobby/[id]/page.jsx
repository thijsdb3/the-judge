import {auth} from "@/lib/auth"
import { getGameLobbies } from '@/lib/data';
import  LobbyBody  from "@/components/gameLobby/LobbyBody"
import styles from "./page.module.css"

const GamePage =  async (context) => {
  const id = context.params.id
  const gamelobbies =  await getGameLobbies();
  const gameIdList = gamelobbies.map(gamelobby => gamelobby.gameid);
  if(gameIdList.includes(id)){
    const session = await auth();
    if(session){
      return (
        <div className = {styles.body}>
              <h1 className = {styles.title}>Waiting for Players...</h1>
          <div className = {styles.container}>
            <LobbyBody className = {styles.list} session = {session} lobbyid = {id}/> 
          </div>   
        </div>
      );
    }
    else {
      return(
        <div className = {styles.body}>
        <h1> please log in </h1>
      </div>
      )
    }
  }
  else {
    return <h1> something went wrong </h1>
  }
};

export default GamePage;