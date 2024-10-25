import mongoose from "mongoose";

const gameLobbiesSchema = new mongoose.Schema({
  gameid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
        enum: ["Judge", "Good", "Evil"],
      },
      teamlocked: {
        type: Boolean,
        required: true,
      },
      turn : {
        type : Boolean,
        required : true,
        default : false,
      }
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
        "investigation",
        "reverse investigation",
        "game ended",
      ],
    },
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
  honestVetoEnabled: {
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
