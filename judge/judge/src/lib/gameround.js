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

export const transitionPhase = async (game, newPhase) => {
  game.currentRound.phase = newPhase;
  await game.save();
};

export const clearRound = async (game) => {
  if (game.currentRound.partner.id) {
    game.previousTeam.partner = game.currentRound.partner.id;
  }

  if (game.currentRound.associate.id) {
    game.previousTeam.associate = game.currentRound.associate.id;
  }

  if (game.currentRound.paralegal.id) {
    game.previousTeam.paralegal = game.currentRound.paralegal.id;
  }

  game.currentRound.partner.id = null;
  game.currentRound.associate.id = null;
  game.currentRound.paralegal.id = null;
  game.currentRound.partner.cards = null;
  game.currentRound.associate.cards = null;
  game.currentRound.paralegal.cards = null;

  await game.save();
};
