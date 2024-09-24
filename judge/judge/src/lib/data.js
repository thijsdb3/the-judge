import { User } from "./models";
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

export const getUsers = async(id)=> {
    try{
        connectToDB();
        const users = await User.find()
        return users;
    }
    catch(err){
        console.log(err);
        throw new Error("failed to fetch user!")
    }
}

