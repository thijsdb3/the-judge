"use client";

export const handlePick = async (selectedPlayer, lobbyid, playerClicking) => {
  try {
    const res = await fetch("/api/game/gameround/pick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lobbyid, selectedPlayer, playerClicking }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(``, data);
    } else {
      console.error("Failed to pick player");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};



