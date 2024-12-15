"use client";
import styles from "./loginform.module.css"
import { useFormState } from "react-dom";
import { login } from "@/lib/action";
import Link from "next/link"

const LoginForm=()=>{
    const [state,formAction] = useFormState(login,undefined);

    return(
        <form className = {styles.form} action = {formAction}>
                <input type  ="text " placeholder ="username" name = "username"/> 
                <input type  ="password" placeholder ="password" name = "password"/>
                <button> Login </button>
                {state?.error}
                <Link href = "/signup"> { "don't have an account?"} <b>Sign Up</b></Link>
            </form> 
   )
}

export default LoginForm