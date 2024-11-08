import CardPhase from "./CardPhase"
import  {Game} from "@/lib/models"
import connectToDB from "@/lib/utils";
import styles from "./Deck.module.css"
import CardsLeft from "./CardsLeft";
import Image from "next/image";

const StaticDeck = async ({ lobbyid, session }) => {
    await connectToDB();
    const game = await Game.findOne({ gameid: lobbyid });
    const userid = session?.user.id;

    if (!game) {
        <span>Game Not Found</span>
    }
    let userCards = [];
    let phase = game.currentRound.phase || "unstarted";
    let playerPeeking = false;
    const CurrentCardsLeft = game.drawPile.length;

    switch (userid) {
      case game.currentRound.partner.id?.toString(): {
        const partnerCards = game.currentRound.partner.cards;
        if (partnerCards && partnerCards.length === 4) {
          userCards = partnerCards;
        }
        break;
      }
    
      case game.currentRound.associate.id?.toString(): {
        const associateCards = game.currentRound.associate.cards;
        if (associateCards && associateCards.length === 3) {
          userCards = associateCards;
        }
        break;
      }
    
      case game.currentRound.paralegal.id?.toString(): {
        const paralegalCards = game.currentRound.paralegal.cards;
        if (paralegalCards && paralegalCards.length === 3) {
          userCards = paralegalCards;
        }
        break;
      }
    
      case game.playerPeeking.id?.toString(): {
        const cardsToPeek = game.playerPeeking.cards;
        if (cardsToPeek && cardsToPeek.length === 2) {
          userCards = cardsToPeek;
          playerPeeking = true;
        }
        break;
      }
    
      default:
        break;
    }
    

   const data =  ({
      cards: userCards,
      phase,
      playerPeeking,
    });
    console.log("these are the user cards",userCards)
return(
<div className={styles.bigbox}>
      <div className={styles.leftbox}>
        <Image 
          src="/images/cards.png" 
          alt="Deck of Cards"
          layout="responsive"  
          width={100}          
          height={150}         
        />
        <div className={styles.deckinfo}>
          <p className={styles.deckinfop}>Cards left in deck:</p>
          <div className={styles.smallbox}>
            <CardsLeft CurrentCardsLeft = {CurrentCardsLeft}  lobbyid = {lobbyid}/>
          </div>
        </div>
      </div>
            <CardPhase session = {session} lobbyid = {lobbyid} data = {data}/>
      </div>
      )
}


export default StaticDeck