import connectToDB from '@/lib/utils'; 
import { GameLobby } from '@/lib/models'; 
import { getGameLobbies } from '@/lib/data';
export async function POST(req, res) {
  await connectToDB(); 
  console.log(req.body)
  try {
    const  id  = await req.json(); 
    const newGameLobby = new GameLobby({gameid:id} ,
      {players : []}
     ) ;
    await newGameLobby.save();

  } catch (error) {
    throw (error)
  }
}
export async function GET(req) {
    try {
      const gamelobbies = await getGameLobbies();
      return new Response(JSON.stringify(gamelobbies), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error fetching game IDs:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch game IDs' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }