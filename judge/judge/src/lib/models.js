import mongoose from "mongoose";
import { nanoid } from "nanoid";

const gameLobbiesSchema = new mongoose.Schema({
  gameid: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => nanoid(10),
  },
  players: [
    {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      judgeFlag: { type: Boolean, default: false },
    },
  ],
});

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 22,
    },

    hashedPassword: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const gameSchema = new mongoose.Schema({
  gameid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  banner: {
    type: String,
    required: true,
    default: "Judge should pick a Partner",
  },
  players: [
    {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        required: true,
        enum: ["Judge", "Good", "Evil"],
      },
      isOnTurn: {
        type: Boolean,
        default: false,
      },
    },
  ],

  boardState: {
    reds: { type: Number, default: 0 },
    blues: { type: Number, default: 0 },
  },
  unpickablePlayers : [{
      type: String,
  }],
  drawPile: [
    {
      type: String,
      enum: ["blue", "red"],
    },
  ],
  discardPile: [
    {
      type: String,
      enum: ["blue", "red"],
    },
  ],

  currentRound: {
    partner: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      cards: [{}],
    },
    associate: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      cards: [{}],
    },
    paralegal: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      cards: [{}],
    },
    phase: {
      type: String,
      enum: [
        "Judge Picks Partner",
        "Partner Picks Associate",
        "Associate Picks Paralegal",
        "seeCards",
        "discardCard",
        "Peek and Discard",
        "Judge picks investigator",
        "Judge picks reverse investigator",
        "investigation",
        "reverse investigation",
        "game ended",
      ],
    },
  },

  playerPeeking: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    cards: [{}],
  },

  playerInvestigating: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  playerBeingInvestigated: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  playerReverseInvestigating: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  playerBeingReverseInvestigated: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  previousTeam: {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    associate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paralegal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },

  gameChat: [
    {
      type: String,
    },
  ],
  HonestVetoEnabled: {
    type: Boolean,
    default: false,
  },
  CorruptVetoEnabled: {
    type: Boolean,
    default: false,
  },
});

export const GameLobby =
  mongoose.models?.GameLobby || mongoose.model("GameLobby", gameLobbiesSchema);
export const User = mongoose.models?.User || mongoose.model("User", userSchema);
export const Game = mongoose.models?.Game || mongoose.model("Game", gameSchema);
