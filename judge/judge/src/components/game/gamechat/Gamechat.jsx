"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Gamechat.module.css";
import Pusher from "pusher-js";

const Gamechat = ({ lobbyid }) => {
  const [gameMessages, setGameMessages] = useState(["Welcome to the Game!"]);
  const messagesEndRef = useRef(null);  // Reference to the last message
  const [isScrolledUp, setIsScrolledUp] = useState(false); // Track if user scrolled up

  useEffect(() => {
    if (lobbyid) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: 'eu',
      });

      const channel = pusher.subscribe(`gameUpdate-${lobbyid}`);

      channel.bind('pusher:subscription_error', (status) => {
        console.error('Pusher subscription error:', status);
      });
  
      channel.bind('gamechat', (data) => {
        setGameMessages(data.gamechat);
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    }
  }, [lobbyid]);

  // Handle scrolling behavior
  useEffect(() => {
    if (!isScrolledUp && messagesEndRef.current) {
      // Scroll to the bottom only if the user is not manually scrolled up
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [gameMessages, isScrolledUp]);

  // Detect when the user scrolls up
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight < scrollHeight - 50) {
      setIsScrolledUp(true);  // User has scrolled up
    } else {
      setIsScrolledUp(false); // User is at the bottom
    }
  };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.navbar}>
        <button className={styles.tab}>Game Messages</button>
      </div>
      <div className={styles.messages} onScroll={handleScroll}>
        <ul>
          {gameMessages.map((message, index) => (
            <li key={index} className={styles.message}>{message}</li>
          ))}
          <div ref={messagesEndRef} /> 
        </ul>
      </div>
    </div>
  );
};

export default Gamechat;
