"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./gamechat.module.css";
import Pusher from "pusher-js";
import { usePathname } from 'next/navigation'
import { retrySubscribe } from "@/lib/pusher";
const GameChat = ({ lobbyid }) => {
  const pathname = usePathname();
  const isGamePath = pathname.startsWith('/game/');
  const [gameMessages, setGameMessages] = useState(["Waiting on players...","game can be started once there are between 6 and 13 players in lobby","If you want to be the Judge click the volunteer button"]);

  const messagesEndRef = useRef(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  useEffect(() => {
    if (isGamePath && lobbyid) {
      const fetchMessages = async () => {
        try {
          const res = await fetch('/api/game/gamechat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyid }),
          });

          const data = await res.json();
          setGameMessages(data.messages.length > 0 ? data.messages : ["Welcome to the Game!"]);
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };

      fetchMessages();
    }
  }, [isGamePath, lobbyid]);

  // Subscribe to Pusher for real-time updates
  useEffect(() => {
    if (isGamePath && lobbyid) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: "eu",
      });
      const setupPusher = async () => {
        try {
          const channel = await retrySubscribe(`gameUpdate-${lobbyid}`, pusher);

          channel.bind("gamechat", (data) => {
            setGameMessages((prevMessages) => [...prevMessages, data.gamechat[data.gamechat.length - 1]]);
          });

          channel.bind("gameUpdateAI", (data) => {
            setGameMessages((prevMessages) => [...prevMessages, data.gamechat[data.gamechat.length - 1]]);
          });
        } catch (error) {
          console.error("Pusher subscription failed:", error);
        }
      };

      setupPusher();

      return () => {
        pusher.unsubscribe(`gameUpdate-${lobbyid}`);
      };
    }
  }, [isGamePath, lobbyid]);

  // Auto-scroll behavior
  useEffect(() => {
    if (!isScrolledUp && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [gameMessages, isScrolledUp]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight < scrollHeight - 50) {
      setIsScrolledUp(true);
    } else {
      setIsScrolledUp(false);
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
            <li key={index} className={styles.message}>
              {message}
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
      </div>
    </div>
  );
};

export default GameChat;
