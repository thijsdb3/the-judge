"use client";

import { useEffect, useState, useCallback } from "react";
import Pusher from "pusher-js";
import { retrySubscribe } from "@/lib/pusher";
import { handlePick } from "@/lib/gameround";
import Image from "next/image";
import styles from "./Players.module.css";
import { memo } from "react";
const InteractivePlayers = ({ players, lobbyid, session  , initialInvestigationState , Termlocks  }) => {
  const username = session?.user?.username;
  const userid = session?.user?.id;

  const currentPlayer = players.find((p) => p.username === username);
  const [investigationState, setInvestigationState] = useState( initialInvestigationState);
  const [myTurn, setMyTurn] = useState(currentPlayer?.myTurn || false);
  const [roleColors, setRoleColors] = useState({});
  const [termlocks,setTermLocks] = useState(Termlocks)

  const fetchRoleColor = useCallback(async (playerUsername) => {
    try {
      const res = await fetch("/api/game/getRole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyid, playerUsername }),
      });
      const { roleColor } = await res.json();
      return roleColor;
    } catch (error) {
      console.error("Error fetching role color:", error);
      return null;
    }
  }, [lobbyid]);

  useEffect(() => {
    const updateRoleColors = async () => {
      const updates = {};
      const { playerBeingInvestigated, playerReverseInvestigating,  } = investigationState;

      if (playerBeingInvestigated) {
        updates[playerBeingInvestigated] = await fetchRoleColor(playerBeingInvestigated);
      }

      if (playerReverseInvestigating) {
        updates[playerReverseInvestigating] = await fetchRoleColor(playerReverseInvestigating);
      }

      setRoleColors((prev) => ({ ...prev, ...updates }));
    };

    updateRoleColors();
  }, [investigationState, fetchRoleColor]);

  useEffect(() => {
    if (!lobbyid || !userid) return;
  
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: "eu" });
    let personalChannel, globalChannel;
  
    const setupPusher = async () => {
      try {
        personalChannel = await retrySubscribe(`gameUpdate-${lobbyid}-${userid}`, pusher);
        globalChannel = await retrySubscribe(`gameUpdate-${lobbyid}`, pusher);
  
        personalChannel.bind("investigation", (data) => {
          setInvestigationState((prev) => ({ ...prev, ...data }));
        });
  
        personalChannel.bind("reverse investigation", (data) => {
          setInvestigationState((prev) => ({ ...prev, ...data }));
        });
  
        globalChannel.bind("termlockUpdate", (data) => {
          setTermLocks(data.termlocks);
        });
  
        globalChannel.bind("gameUpdateAI", (data) => {
          setTermLocks(data.termlocks);
        });
  
        personalChannel.bind("myTurn", ({ turn }) => setMyTurn(turn));
      } catch (error) {
        console.error("Pusher subscription failed:", error);
      }
    };
  
    setupPusher();
  
    return () => {
      if (personalChannel) {
        personalChannel.unbind_all();
        personalChannel.unsubscribe();
      }
      if (globalChannel) {
        globalChannel.unbind_all();
        globalChannel.unsubscribe();
      }
      pusher.disconnect();
    };
  }, [lobbyid, userid]);

  if (!players || !session) return <div>Loading...</div>;
  {console.log(termlocks)}

  return (
    <ul>
      {players.slice(1).map((player, index) => {
        const isInvestigated =
          investigationState.playerInvestigating === username &&
          investigationState.playerBeingInvestigated === player.username;

        const isReverseInvestigated =
          investigationState.playerReverseInvestigating === player.username &&
          investigationState.playerBeingReverseInvestigated === username;

        const color = roleColors[player.username] || (isInvestigated || isReverseInvestigated ? "blue" : player.color);

        return (
          <li
            key={player.username}
            className={`${styles.playerlistelement} ${(myTurn && player.username !== currentPlayer?.username && !termlocks?.includes(player.username)) ? styles.myTurn : ""}`}
            style={{ color }}
            onClick={() => myTurn && handlePick(player, lobbyid, username)}
          >
            <Image src="/images/player.png" alt="Player Avatar" width={30} height={30} />
            {player.username}
          </li>
        );
      })}
    </ul>
  );
};

export default memo(InteractivePlayers);
