import connectToDB from '@/lib/utils'; 
import { GameId } from '@/lib/models'; 
import { getGameIds } from '@/lib/data';
export async function POST(req, res) {
  await connectToDB(); 
  console.log(req.body)
  try {
    const  id  = await req.json(); 
    const newGameId = new GameId({gameid:id} ) ;
    await newGameId.save();

  } catch (error) {
    throw (error)
  }
}
export async function GET(req) {
    try {
      const gameids = await getGameIds();
      return new Response(JSON.stringify(gameids), {
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