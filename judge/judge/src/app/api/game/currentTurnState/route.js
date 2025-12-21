import { Game, User } from "@/lib/models";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { lobbyid, userid } = await req.json();
  const game = await Game.findOne({ gameid: lobbyid });

  const isMyTurn = getTurnOwnerIds(game).some((id) => id.toString() === userid);

  const users = await User.find({
    _id: { $in: game.currentRound.unselectables },
  }).select("username");

  return NextResponse.json({
    myTurn: isMyTurn,
    unselectables: users.map((u) => u.username),
  });
}
function getTurnOwnerIds(game) {
  const { phase, judge, partner, associate, paralegal } = game.currentRound;

  switch (phase) {
    case "Judge Picks Partner":
      return [judge];

    case "Partner Picks Associate":
      return partner?.id ? [partner.id] : [];

    case "Associate Picks Paralegal":
      return associate?.id ? [associate.id] : [];

    case "Peek and Discard":
      return [];
    case "Choose Peeking Player":
      return [judge];
    case "Judge picks investigator":
      return [judge];

    case "Judge picks reverse investigator":
      return [judge];

    case "investigation":
      return game.currentRound.playerInvestigating
        ? [game.currentRound.playerInvestigating]
        : [];

    case "reverse investigation":
      return game.currentRound.playerReverseInvestigating
        ? [game.currentRound.playerReverseInvestigating]
        : [];

    case "game ended":
    default:
      return [];
  }
}
