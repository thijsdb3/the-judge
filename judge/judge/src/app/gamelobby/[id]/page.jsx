import {auth} from "@/lib/auth"
import { getGameLobbies } from '@/lib/data';
import PlayerList from "@/components/gameLobby/PlayerList"

const GamePage =  async (context) => {
  const id = context.params.id
  const gamelobbies =  await getGameLobbies();
  const gameIdList = gamelobbies.map(gamelobby => gamelobby.gameid);
  if(gameIdList.includes(id)){
    const session = await auth();
    if(session){
      return (
        <div>
          <h1>Waiting for Players...</h1>
          <PlayerList session = {session}/> 
        </div>
      );
    }
    else {
      return <h1> please log in </h1>
    }
  }
  else {
    return <h1> something went wrong </h1>
  }
};

export default GamePage;