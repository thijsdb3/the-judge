import mongoose from "mongoose";

const gameLobbiesSchema = new mongoose.Schema({
  gameid : {
    type : String,
    required : true,
    unique : true,
  },
    players : [ {
    type : mongoose.Schema.Types.ObjectId ,
    ref : "User"
  }]
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

export const GameLobby = mongoose.models?.GameLobby || mongoose.model("GameLobby", gameLobbiesSchema);
export const User = mongoose.models?.User || mongoose.model("User", userSchema);
