import { triggerPusherEvent } from "./pusher";
import { clearRound , transitionPhase } from "./gameround";

export const  handleCorruptVeto = async(game)  => {
    const partner = game.players.find((p) =>
      p.player._id.equals(game.currentRound.paralegal.id)
    );
    const associate = game.players.find((p) =>
      p.player._id.equals(game.currentRound.associate.id)
    );
  
    const paralegal = game.players.find((p) =>
      p.player._id.equals(game.currentRound.partner.id)
    );
    if (
      paralegal.role === "Evil" &&
      associate.role === "Evil" &&
      partner.role === "Evil"
    ) {
      game.gameChat.push("entire team is corrupt");
      await triggerPusherEvent(`gameUpdate-${game.gameid}`, "gamechat", {
        gamechat: game.gameChat,
      });
      game.gameChat.push("honest evidence automatically vetod");
      await triggerPusherEvent(`gameUpdate-${game.gameid}`, "gamechat", {
        gamechat: game.gameChat,
      });
      game.gameChat.push("corrupt team has won");
      await triggerPusherEvent(`gameUpdate-${game.gameid}`, "gamechat", {
        gamechat: game.gameChat,
      });
      await transitionPhase(game, "game ended");
      return true;
    }
    return false;
  }
  
  export const  handleHonestVeto = async (game) => {
    console.log("honest veto function runs");
  
    const partner = game.players.find((p) =>
      p.player._id.equals(game.currentRound.paralegal.id)
    );
    const associate = game.players.find((p) =>
      p.player._id.equals(game.currentRound.associate.id)
    );
  
    const paralegal = game.players.find((p) =>
      p.player._id.equals(game.currentRound.partner.id)
    );
    console.log("this is the partners role", partner.role);
    console.log("this is the associate role", associate.role);
    console.log("this is the paralegals role", paralegal.role);
    if (
      paralegal.role === "Good" &&
      associate.role === "Good" &&
      partner.role === "Good"
    ) {
      console.log("all players are good");
      game.gameChat.push("entire team is good");
      await triggerPusherEvent(`gameUpdate-${game.gameid}`, "gamechat", {
        gamechat: game.gameChat,
      });
      game.gameChat.push("corrupt evidence automatically vetod");
      await triggerPusherEvent(`gameUpdate-${game.gameid}`, "gamechat", {
        gamechat: game.gameChat,
      });
      console.log("this is the player length:", game.players.length);
      if (game.players.length == 6) {
        game.gameChat.push("honest team has won");
        await triggerPusherEvent(`gameUpdate-${game.gameid}`, "gamechat", {
          gamechat: game.gameChat,
        });
        await transitionPhase(game, "game ended");
        return true;
      } else {
        game.gameChat.push("Judge needs to pick a new team");
        await triggerPusherEvent(`gameUpdate-${game.gameid}`, "gamechat", {
          gamechat: game.gameChat,
        });
        await clearRound(game);
        await transitionPhase(game, "Judge Picks Partner");
        return true;
      }
    }
    return false;
  }
  