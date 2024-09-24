import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"
import {User} from "./models" 
import connectToDB from "./utils"
import bcrypt from "bcryptjs"
import authConfig  from "./auth.config";


const login = async(credentials) => {
    try{
        connectToDB()
        const user = await  User.findOne({username: credentials.username})
        console.log(credentials.password)
        console.log(user.password) //doesn't get saved in db smth goes wrong in signUp from  action.js
       
      if(!user){
        throw new Error("wrong credentials!");
      }
       const isPasswordCorrect = await bcrypt.compare(credentials.password,user.hashedPassword);
       if(!isPasswordCorrect){
         console.log("password issue")
         throw new error ("wrong credentials)")
       }
      return user;

        }catch(err){
            console.log(err)
            throw new Error("wrong credentials!");
        }
}

export const {handlers :{GET,POST},auth, signIn, signOut} 
    = NextAuth({
    ...authConfig,
    providers: [
    CredentialsProvider({
        async authorize(credentials){
            try{
                const user = await login(credentials);
                return user;
            }catch(err){
                return null
            }
        }
    })
   ],
   callbacks:{
    async signIn({user,account,profile}){
        console.log(user,account,profile)
        return true;
    },
      ...authConfig.callbacks,
   }
});

