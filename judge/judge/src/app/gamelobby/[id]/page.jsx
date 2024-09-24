import PlayerList from "@/components/gamelobby/PlayerList" 
import {auth} from "@/lib/auth"

const GamePage =  async () => {
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
};

export default GamePage;
