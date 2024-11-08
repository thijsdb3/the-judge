import { Game } from '@/lib/models';
import connectToDB from '@/lib/utils';
import InteractivePlayers from './InteractivePlayers';

const StaticPlayers = async ({ lobbyid, session }) => {

    await connectToDB();
    const game = await Game.findOne({ gameid: lobbyid }).populate("players.player");
  
    if (!game) {
      return (
        <div>
          <h1>Error: Game not found</h1>
        </div>
      );
    }
  
    const allPlayers = game.players;
  
    const judgePlayer = allPlayers?.find(player => player.role === "Judge");
    if (!judgePlayer) {
      return (
        <div>
          <h1>Error: Judge not found in the player list</h1>
        </div>
      );
    }

    const otherPlayers = allPlayers.filter(player => player.role !== "Judge");
    const orderedPlayers = [judgePlayer, ...otherPlayers];
    const playerData = orderedPlayers.map((p) => ({
        username: p.player.username,
        role: p.role,
      }));
  
    return (
      <div>
        <InteractivePlayers players={playerData} lobbyid={lobbyid} session={session} />
      </div>
    );
  };

  export  default StaticPlayers