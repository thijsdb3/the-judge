import LoginForm from "@/components/auth/loginform/Loginform";
import styles from "./login.module.css"

const LoginPage =   () => {
    return(
       <div className = {styles.container}>
       <div className = {styles.wrapper}>
        <div>
        <LoginForm/>
        </div>
        </div>
        </div>
    )
}

export default LoginPage