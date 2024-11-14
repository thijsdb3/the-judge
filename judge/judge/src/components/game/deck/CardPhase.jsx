"use client";

import styles from "./Deck.module.css";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Pusher from "pusher-js";


const CardPhase = ({ lobbyid, session , data}) => {
  const [userCards, setUserCards] = useState(data.cards);
  const [phase, setPhase] = useState(data.phase);
  const [selectedCard, setSelectedCard] = useState(null);
  const [playerPeeking, setPlayerPeeking] = useState(data.playerPeeking);
  const userid = session?.user?.id
  
    useEffect(() => {
    if(session){
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
          cluster: 'eu',
        });
        const channel = pusher.subscribe(`gameUpdate-${lobbyid}-${userid}`);
  
        channel.bind('pusher:subscription_error', (status) => {
          console.error('Pusher subscription error:', status);
        });
  
        channel.bind('cardPhaseStarted', () => setPhase('seeCards'));
  
        channel.bind('seeCards', (message) => {
          setUserCards(message.cards);
          setPhase('discardCard');
        });
  
        channel.bind('receivePartnerCards', (message) => {
          setUserCards(message.cards);
          setPhase('discardCard');
        });
  
        channel.bind('peekAndDiscardPhaseStarted', (message) => {
          setPlayerPeeking(true);
          setUserCards(message.cards);
          setPhase('Peek and Discard');
        });
  
 
        return () => {
          channel.unbind_all();
          channel.unsubscribe();
        };
    }
    }, [session, lobbyid ,userid]);
  
    // Function to fetch and see the cards when the user clicks a button
    const handleSeeCardsClick = async () => {
      if (phase === 'seeCards' || phase === 'receivePartnerCards') {
        await fetch('/api/game/gameround/cardPhase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userid: session.user.id, lobbyid, action: 'seeCards' }),
        }).catch((error) => console.error('Error seeing cards:', error));
      }
    };
      const handleCardClick = async (card) => {
      if (phase === 'discardCard') {
        setSelectedCard(card); 
        setPhase(null); // Prevent further clicks until the server responds
  
        await fetch('/api/game/gameround/cardPhase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userid: session.user.id, lobbyid, action: 'discardCard', card }),
        }).then(() => {
          setPhase('unstarted'); // Reset or progress to the next phase after discarding
        }).catch((error) => console.error('Error discarding card:', error));
      }
    };
  
    const handlePeekAction = async (action, card = null) => {
      let requestData = { userid: session.user.id, lobbyid, action: 'Peek and Discard' };
      
      if (action === 'discardOne' && card) {
        requestData = { ...requestData, discardOption: 'discardOne', card };
      } else if (action === 'putBack') {
        requestData = { ...requestData, discardOption: 'discardNone' };
      }
    
      await fetch('/api/game/gameround/cardPhase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      }).then(() => {
        setPhase('unstarted');
        setPlayerPeeking(false); // Reset peeking state after action
      }).catch((error) => console.error('Error handling peek action:', error));
    };

  return (
      <div>
        {/* Show "See Cards" button when in the "seeCards" phase */}
        {phase === 'seeCards' && (
          <button onClick={handleSeeCardsClick} className={styles.seeCardsButton}>
            See Your Cards
          </button>
        )}

        {phase === 'discardCard' && userCards.map((card, index) => (
          <div 
            key={index} 
            className={styles.cardContainer} 
            onClick={() => handleCardClick(card)}
          >
            <div className={styles.cardlayout}>
              <Image 
                src={`/images/${card}.png`} 
                alt={`Card ${card}`} 
                layout="responsive"  
                width={300} 
                height={300} 
              />
            </div>
          </div>
        ))}

        {/* Peek and discard logic */}
        {phase === 'Peek and Discard' && (
  <div>
    {userCards.map((card, index) => (
      <div key={index} className={styles.cardContainer}>
        <div className={styles.cardlayout}>
          <Image 
            src={`/images/${card}.png`} 
            alt={`Card ${card}`} 
            layout="responsive"  
            width={100} 
            height={100} 
          />
          {playerPeeking && (
            <button 
              className={styles.discardthis} 
              onClick={() => handlePeekAction('discardOne', card)}>
              Discard This
            </button>
          )}
        </div>
      </div>
    ))}
    {playerPeeking && (
      <button 
        className={styles.putbothback} 
        onClick={() => handlePeekAction('putBack')}>
        Put Both Back
      </button>
    )}
  </div>
)}

      </div>
  );
};

export default CardPhase;
