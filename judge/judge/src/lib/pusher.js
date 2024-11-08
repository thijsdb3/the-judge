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
  }