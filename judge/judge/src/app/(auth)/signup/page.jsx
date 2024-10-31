import styles from "./signup.module.css"
import RegisterForm from "@/components/auth/registerform/RegisterForm"

const SignUpPage = () => {
    return (
        <div className = {styles.container}>
        <div className = {styles.wrapper} >
             <RegisterForm/> 
        </div> 
        </div>
    )
}

export default SignUpPage