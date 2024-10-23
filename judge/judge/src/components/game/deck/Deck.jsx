"use client";

import styles from "./Deck.module.css";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Pusher from "pusher-js";

const Deck = ({ lobbyid, session }) => {
  const [userCards, setUserCards] = useState([]);
  const [phase, setPhase] = useState('unstarted'); // Initial phase is unstarted
  const [selectedCard, setSelectedCard] = useState(null); // Track the card selected for discarding
  const [cardsLeft, setCardsLeft] = useState(33); // Track cards left in deck
  const [playerPeeking, setPlayerPeeking] = useState(false); // Track if player is peeking at cards

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

      // Event triggered when the card phase begins
      channel.bind('cardPhaseStarted', () => {
        setPhase('seeCards');
      });

      // Event triggered when server sends the cards to the user
      channel.bind('seeCards', (message) => {
        setUserCards(message.cards);
        setPhase('discardCard'); // Transition to discard phase after showing cards
      });

      // Event for receiving partner cards
      channel.bind('receivePartnerCards', (message) => {
        setUserCards(message.cards);
        setPhase('discardCard'); 
      });

    
      channel.bind('peekAndDiscardPhaseStarted', (message) => {
        setPlayerPeeking(true); 
        setUserCards(message.cards)
        setPhase('peekAndDiscard'); 
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
    let requestData = { userid: session.user.id, lobbyid, action: 'peek and discard' };
    
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
                width={100} 
                height={150} 
              />
            </div>
          </div>
        ))}

        {/* Peek and discard logic */}
        {phase === 'peekAndDiscard' && userCards.map((card, index) => (
  <div 
    key={index} 
    className={styles.cardContainer} 
  >
    <div className={styles.cardlayout}>
      <Image 
        src={`/images/${card}.png`} 
        alt={`Card ${card}`} 
        layout="responsive"  
        width={100} 
        height={150} 
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
