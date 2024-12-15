import Pusher from "pusher";

const { PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET } = process.env;
const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: NEXT_PUBLIC_PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: "eu",
});

export const triggerPusherEvent = async (channel, event, data) => {
  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error(
      `Error triggering Pusher event: ${event} on ${channel}`,
      error
    );
  }
};

export async function updateGameUI(game, lobbyid) {
  if (!game) return;

  const consolidatedUpdate = {};
  if (game.gameChat) consolidatedUpdate.gamechat = game.gameChat;
  if (game.banner) consolidatedUpdate.banner = game.banner;
  if (game.unpickablePlayers)
    consolidatedUpdate.termlocks = game.unpickablePlayers;

  try {
    await triggerPusherEvent(
      `gameUpdate-${lobbyid}`,
      "gameUpdateAI",
      consolidatedUpdate
    );
    console.log(
      "Game update event triggered successfully:",
      consolidatedUpdate
    );
  } catch (error) {
    console.error("Failed to trigger game update event:", error);
  }
}
export const retrySubscribe = async (channelName, pusherInstance, maxRetries = 5, delayMs = 1000) => {
  let attempts = 0;

  const subscribeWithRetry = () =>
    new Promise((resolve, reject) => {
      const subscribe = () => {
        const channel = pusherInstance.subscribe(channelName);

        channel.bind("pusher:subscription_succeeded", () => {
          console.log(`Successfully subscribed to ${channelName}`);
          resolve(channel);
        });

        channel.bind("pusher:subscription_error", (status) => {
          console.error(`Pusher subscription error (${status}). Retry #${attempts + 1}`);
          if (attempts < maxRetries) {
            attempts++;
            setTimeout(subscribe, delayMs * Math.pow(2, attempts - 1)); 
          } else {
            reject(`Failed to subscribe to ${channelName} after ${maxRetries} attempts.`);
          }
        });
      };

      subscribe();
    });

  return subscribeWithRetry();
};
