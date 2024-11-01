export async function handleMakeGame(router) {
  try {
    const response = await fetch("/api/gameid", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to create game");
    }

    const data = await response.json();
    const newGameId = data.gameid;

    router.push(`/gamelobby/${newGameId}`);
  } catch (error) {
    console.error("Error creating game:", error);
  }
}

export async function handleJoinGame(router) {
  const input = prompt("Enter the Game ID to join:");
  if (!input) return;

  try {
    const response = await fetch(`/api/gameid?id=${input}`, {
      method: "GET",
    });
    const result = await response.json();

    if (result.exists) {
      router.push(`/gamelobby/${input}`);
    } else {
      alert("The Game ID you entered is invalid or does not match.");
    }
  } catch (error) {
    console.error("Error joining game:", error);
  }
}
