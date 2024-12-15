"use client";
import { useState ,useEffect} from "react";
import Pusher from "pusher-js";
import { retrySubscribe } from "@/lib/pusher";
import styles from "./Players.module.css"
const Banner =  ({ banner ,lobbyid }) => {
  const [newBanner, setBanner] = useState(banner);
    useEffect(() => {
    
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: 'eu',
      });
     const setupPusher = async () => {
      try {
        const channel = await retrySubscribe(`gameUpdate-${lobbyid}`, pusher);

        channel.bind("banner", (message) => {
          setBanner(message.banner);
        });

        channel.bind("gameUpdateAI", (message) => {
          setBanner(message.banner);
        });
      } catch (error) {
        console.error("Pusher subscription failed:", error);
      }
    };

    setupPusher();
    return () => {
      pusher.unsubscribe(`gameUpdate-${lobbyid}`);
      };
    },[lobbyid])

  return <h2 className = {styles.title}>{newBanner}</h2>
};

export default Banner;
