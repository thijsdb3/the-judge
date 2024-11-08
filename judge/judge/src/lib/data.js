import { User , GameLobby} from "./models";
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


export const getGameLobby = async(id) => {
    try{
        connectToDB();
        const gamelobbies = await GameLobby.findById(id)
        return gamelobbies;
    }
    catch(err){
        console.log(err);
        throw new Error("failed to fetch gamelobbies!")
    }
}

export const getGameLobbies = async()=> {
    try{
        connectToDB();
        const gamelobbies = await GameLobby.find().lean()
        return gamelobbies;
    }
    catch(err){
        console.log(err);
        throw new Error("failed to fetch gamelobbies!")
    }
}



