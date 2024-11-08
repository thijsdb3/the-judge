"use client"

import { useState ,useEffect} from "react";
import Pusher from "pusher-js";
import styles from "./BoardState.module.css"

const RedState = ({redstate, lobbyid} ) => {

    const [redState, setRedState] = useState(redstate);     
      useEffect(() => {
          const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: 'eu',
          });
          const channel = pusher.subscribe(`gameUpdate-${lobbyid}`);
    
          channel.bind('pusher:subscription_error', (status) => {
            console.error('Pusher subscription error:', status);
          });
    
          channel.bind('RedUpdate', (message) => {
            setRedState(message.redstate);
          });
    
    
          return () => {
            channel.unbind_all();
            channel.unsubscribe();
          };
      }, [lobbyid]);
    
    return ( <span className = {styles.bignumberevil}> {` ${redState}`} </span>)
}
export default RedState