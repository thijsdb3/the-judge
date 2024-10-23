"use client";

import styles from "./BoardState.module.css";
import { useState, useEffect } from 'react';
import Pusher from "pusher-js";

const BoardState = ({ lobbyid }) => {
  const [blueState, setBlueState] = useState(0); 
  const [redState, setRedState] = useState(0); 
  
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
        if(blueState == 4){
        }
      });

      // Event triggered when server sends the cards to the user
      channel.bind('RedUpdate', (message) => {
        setRedState(message.redstate);
        if(redState == 4 ){
        }
      });
      

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    
  }, [lobbyid]);

 
    return (
        <div className = {styles.rightbox}>
                <div className = {styles.rightboxhalfupper}>
                <span className = {styles.bignumbergood}> {` ${blueState}`} </span>
                </div>
             <div className = {styles.rightboxhalflower}>
             <span className = {styles.bignumberevil}> {` ${redState}`} </span>
             </div>
        </div>
        
    )
}

export default BoardState 