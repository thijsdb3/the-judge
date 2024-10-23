

import mongoose from "mongoose";

const connection = {};

const connectToDB = async() => {
    try {
        if(connection.isConnected){
            //console.log("Using existing connection");
            return;
        }
       const db =  await mongoose.connect(process.env.MONGO)
       connection.isConnected = db.connections[0].readyState;
    }catch (error){
        console.log(error)
        throw new Error(error);
    }

};

export const fisherYatesShuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  

export default connectToDB
