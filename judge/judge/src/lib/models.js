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
      maxlength: 20,
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
        enum: ["Judge", "Good", "Evil", "Blindman"],
      },
    },
  ],
  boardState: {
    reds: { type: Number },
    blues: { type: Number },
  },

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
    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
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
    playerPeeking: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
  playerInvestigating: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  playerReverseInvestigating: {
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
