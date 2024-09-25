import mongoose from "mongoose";

const gameIdSchema = new mongoose.Schema({
  gameid : {
    type : String,
    required : true,
    unique : true,
  }
})

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength : 3,
    maxlength : 20,
  },
  email: {
    type: String,
    required: true,
    minlength: 6,
  },
  hashedPassword: {
    type: String,
    required : true,
  },

},
  { timestamps: true }
);

export const GameId = mongoose.models?.GameId || mongoose.model("GameId", gameIdSchema);
export const User = mongoose.models?.User || mongoose.model("User", userSchema);
