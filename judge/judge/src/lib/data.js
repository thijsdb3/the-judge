import { User , GameId} from "./models";
import connectToDB from "./utils"


export const getUser = async(id)=> {
    try{
        connectToDB();
        const user = await User.findById(id)
        return user;
    }
    catch(err){
        console.log(err);
        throw new Error("failed to fetch user!")
    }
}

export const getUsers = async()=> {
    try{
        connectToDB();
        const users = await User.find()
        return users;
    }
    catch(err){
        console.log(err);
        throw new Error("failed to fetch users!")
    }
}

export const getGameId = async(id) => {
    try{
        connectToDB();
        const gameid = await GameId.findById(id)
        return gameid;
    }
    catch(err){
        console.log(err);
        throw new Error("failed to fetch gameid!")
    }
}

export const getGameIds = async()=> {
    try{
        connectToDB();
        const gameids = await GameId.find()
        return gameids;
    }
    catch(err){
        console.log(err);
        throw new Error("failed to fetch gameids!")
    }
}