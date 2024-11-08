import connectToDB from "@/lib/utils";
import { Game } from "@/lib/models";
import styles from "./BoardState.module.css"
import BlueState from "./BlueState";
import RedState from "./RedState";

const StaticBoardState =  async ({lobbyid}) => {
    await connectToDB();

    const game = await Game.findOne({ gameid: lobbyid });

    if (!game) {
     <span>Game Not Found </span>
    }

    const numberOfReds = game.boardState.reds || 0; 
    const numberOfBlues = game.boardState.blues || 0; 

    return (
        <div className = {styles.rightbox}>
                <div className = {styles.rightboxhalfupper}>
                <BlueState  bluestate = {numberOfBlues} lobbyid = {lobbyid}/>
                </div>
             <div className = {styles.rightboxhalflower}>
                <RedState  redstate = {numberOfReds}   lobbyid = {lobbyid}/>
             </div>
        </div>
    )
}
export default  StaticBoardState