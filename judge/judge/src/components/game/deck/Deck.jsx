"use client";

import styles from "./Deck.module.css";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Pusher from "pusher-js";

const Deck = ({ lobbyid, session }) => {
  const [userCards, setUserCards] = useState([]);
  const [phase, setPhase] = useState('unstarted');
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardsLeft, setCardsLeft] = useState(34);
  const [playerPeeking, setPlayerPeeking] = useState(false);
  const userid = session?.user.id;



useEffect(() => {
  // Fetch current state from the database on component mount
  if (!userid || !lobbyid) return; 
  const fetchCurrentState = async () => {
    try {
      const res = await fetch(`/api/game/gameround/getUserCards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, lobbyid }),
      });
      
      if (!res.ok) {
        console.error('Failed to fetch user cards:', res.statusText);
        return;
      }
  
      const data = await res.json();
      if (data.cards) {
        setUserCards(data.cards);
        setPhase(data.phase || 'unstarted');
        setPlayerPeeking(data.playerPeeking)
        setCardsLeft(data.cardsleft)
        console.log("these are the user cards after response", data.cards);
        console.log("this is the phase after response", data.phase || 'unstarted');
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error);
    }}
    if (lobbyid && userid) {
      fetchCurrentState();
    }

  }, [lobbyid,userid] );

  useEffect(() => {

    if (session) {

      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: 'eu',
      });
      const userid = session.user.id;
      const channel = pusher.subscribe(`gameUpdate-${lobbyid}-${userid}`);
      const deckinfochannel = pusher.subscribe(`gameUpdate-${lobbyid}`);

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

      deckinfochannel.bind('updateDeckCount', (message) => {
        setCardsLeft(message.cardsLeft);
      });

      return () => {
        channel.unbind_all();
        deckinfochannel.unbind_all();
        channel.unsubscribe();
        deckinfochannel.unsubscribe();
      };
    }
  }, [session, lobbyid]);

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

  // Function to handle card selection (for discarding)
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

  // Function to handle the peek and discard phase for playerPeeking
  const handlePeekAction = async (action, card = null) => {
    console.log("handlePeekAction runs")
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
            <span className={styles.bignumber}>{cardsLeft}</span>
          </div>
        </div>
      </div>

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
        {phase === 'Peek and Discard' && userCards.map((card, index) => (
  <div 
    key={index} 
    className={styles.cardContainer} 
  >
    <div className={styles.cardlayout}>
      <Image 
        src={`/images/${card}.png`} 
        alt={`Card ${card}`} 
        layout="responsive"  
        width={300} 
        height={300} 
      />
      {playerPeeking && (
        <div className={styles.peekOptions}>
          <button onClick={() => handlePeekAction('discardOne', card)}>Discard This</button>
          <button onClick={() => handlePeekAction('putBack')}>Put Both Back</button>
        </div>
      )}
    </div>
  </div>
))}

      </div>
    </div>
  );
};

export default Deck;
