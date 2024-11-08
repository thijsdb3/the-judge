"use client"

import { useState ,useEffect} from "react";
import Pusher from "pusher-js";
import styles from "./BoardState.module.css"

const BlueState = ({bluestate,lobbyid} ) => {

    const [blueState, setBlueState] = useState(bluestate);     
      useEffect(() => {
          const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: 'eu',
          });
          const channel = pusher.subscribe(`gameUpdate-${lobbyid}`);
    
          channel.bind('pusher:subscription_error', (status) => {
            console.error('Pusher subscription error:', status);
          });
    
          // Event triggered when the card phase begins
          channel.bind('BlueUpdate', (message) => {
            setBlueState(message.bluestate);
          });
    
    
          return () => {
            channel.unbind_all();
            channel.unsubscribe();
          };
      }, [lobbyid]);
    
    return ( <span className = {styles.bignumbergood}> {` ${blueState}`} </span>)
}
export default BlueState