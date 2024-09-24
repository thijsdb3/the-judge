"use client"
import { useState, useEffect } from 'react';
import Link from "next/link"

const PlayerList = (props) => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (props.session) { // Ensure WebSocket runs after session is loaded
      const ws = new WebSocket('ws://localhost:8000');

      ws.onopen = () => {
        const username = props.session.user.username;
        ws.send(JSON.stringify({ type: 'join', username })); // Send username to server
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'userList') {
          setPlayers(message.users); // Update the list of players with the usernames
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed on cleanup');
      };

      return () => {
        ws.close(); // Cleanup WebSocket on component unmount
      };
    }
  }, [props.session]);  
  const canStartGame =  true // to be updated to  players.length > 6; 
  return (
    <div>
      <h2>Players in Lobby</h2>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>
      <Link href="/game">
        <button disabled={!canStartGame} >Start Game</button>
      </Link>
    </div>
  );
};

export default PlayerList;
