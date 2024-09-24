import Links from "./links/Links"
import styles from   "./navbar.module.css"
import {auth} from '@/lib/auth'

const NavBar = async () => {
    const session  = await auth();

    return (
        <navbar className = {styles.container}> 
            <div className ={styles.logo} > The Judge </div>
            <div>
                <h2 className = {styles.username}>{session?.user.username} </h2>
                <Links session = {session}/>
            </div>
            
         </navbar>
    )
}


export default NavBar