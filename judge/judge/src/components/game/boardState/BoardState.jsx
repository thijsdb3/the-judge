"use client";

import styles from "./BoardState.module.css";
import { useState, useEffect } from 'react';
import Pusher from "pusher-js";
import { usePathname } from "next/navigation";

const BoardState = ({ lobbyid }) => {
  const [blueState, setBlueState] = useState(0); 
  const [redState, setRedState] = useState(0); 
  const pathname = usePathname();
  const isGamePath = pathname.startsWith('/game/');
    useEffect(() => {
      // Fetch current state from the database on component mount
      if (!lobbyid  ) return; 
      if(isGamePath){
      const fetchCurrentBoardState = async () => {
        try {
          const res = await fetch(`/api/game/currentBoardState`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyid }),
          });
          
          if (!res.ok) {
            console.error('Failed to fetch current BoardState')
            return;
          }
      
          const data = await res.json();
          if(data.numberOfBlues && data.numberOfReds){
            setBlueState(data.numberOfBlues);
            setRedState(data.numberOfReds);
          }
          
        } catch (error) {
          console.error('Error parsing JSON response:', error);
        }}
        if (lobbyid) {
          fetchCurrentBoardState();
        }
      }
      }, [lobbyid] );
  
    useEffect(() => {
        if(isGamePath){
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
      }
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