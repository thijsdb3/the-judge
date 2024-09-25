
export async function handleMakeGame(router) {
  const newId = Math.floor(Math.random() * 100000000).toString();

  try {
    await fetch('/api/gameid', {
      method: 'POST',
      body: newId,
    });
    router.push(`/gamelobby/${newId}`);

  } catch (error) {
    console.error('Error creating game:', error);
    alert('Error creating game. Please try again.'); // replace by smth less annoying
  }
}

export async function handleJoinGame(router) {
  const input = prompt("Enter the Game ID to join:");
  if (!input) return;

  try {
    const response = await fetch('/api/gameid', {
      method: 'GET',
    });
    const gameIds = await response.json();
    const gameIdList = gameIds.map(game => game.gameid.toString());
   
    if (gameIdList.includes(input)) {
      router.push(`/gamelobby/${input}`);
    } else {
      alert("The Game ID you entered is invalid or does not match."); // replace by something less annoying
    }
  } catch (error) {
    throw(error)
  }
}