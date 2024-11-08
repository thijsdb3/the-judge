
"use client"
import Pusher from "pusher-js";
import { useEffect,useState } from "react";
import styles from "./Deck.module.css"

const CardsLeft = ({CurrentCardsLeft,lobbyid}) => {
    const [cardsLeft, setCardsLeft] = useState(CurrentCardsLeft);
    useEffect(() => {
    
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: 'eu',
      });
    const deckinfo = pusher.subscribe(`gameUpdate-${lobbyid}`);

    deckinfo.bind('updateDeckCount', (message) => {
        setCardsLeft(message.cardsLeft);
    });
    return () => {
        deckinfo.unbind_all();
        deckinfo.unsubscribe();
      };
    },[])

    return(
        <span className={styles.bignumber}  > {cardsLeft} </span>
    )
}
export default CardsLeft