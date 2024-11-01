"use client";
import styles from "./registerForm.module.css"
import { useFormState } from "react-dom";
import { SignUp } from "@/lib/action";
import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link"

const RegisterForm=()=>{
    const [state,formAction] = useFormState(SignUp,undefined);
    const router = useRouter();
    useEffect(()=>{
        state?.success && router.push("/login");
    },[state?.success,router])
    return(
        <form className = {styles.form} action = {formAction}>
                <input type  ="text " placeholder ="username" name = "username"/> 
                <input type  ="password " placeholder ="password" name = "password"/>
                <input type  ="password " placeholder ="password again" name = "passwordRepeat"/>
                <button> Sign up </button>
                {state?.error}
                <Link href = "/login">have an account? <b>login</b></Link>
            </form> 
   )
}

export default RegisterForm