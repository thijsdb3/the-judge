"use server";
import { User } from "./models"; 
import connectToDB from "./utils"
import {signIn, signOut}from "./auth"
import bcrypt from "bcryptjs";

export const SignUp = async (previousState,formData) => {
    const {username,email,password, passwordRepeat}= 
    Object.fromEntries(formData);
    console.log(password)
    if(password !==passwordRepeat ){
        return {error : "password does not match"};
    }
    try {
        connectToDB();
        const user = await User.findOne({username});
        if(user){
            return{ error : "username already exists"};
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);
        console.log("this is the hashedpassword", hashedPassword)
        const newUser = new User({
            username,
            email,
            hashedPassword,
        });
        console.log(newUser)
        await newUser.save();
        console.log("saved to db");
        return {success: true};
    } catch(error){
        console.log(error);
        return {error : "something went wrong"};
    }
};
export const login = async (prevState,formData) => {
    const {username,password}= Object.fromEntries(formData);

    try {
        await signIn("credentials",{username,password});
        return true;
    } catch(error){
        console.log(error);
        if(error.message.includes("credentialssignin")){
            console.log(username)
            console.log(password)

            return {error: "invalid  username or password"}
        }
        throw error;
    }
};



export const handleLogout =async () => {
     await signOut();
}