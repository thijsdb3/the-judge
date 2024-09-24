"use client";
import styles from "./links.module.css";
import NavLink from "./navlinks/NavLink";
import {useState} from "react"
import {handleLogout} from "@/lib/action"

const links = [
  {
    title: "Homepage",
    path: "/",
  },
  {
    title: "Rules",
    path: "/rules",
  },


  {
    title: "Signup",
    path: "/signup",
  },

];


const Links =   ({session}) => {
  const [open,setOpen] = useState(false)
  

  return (
    <div className = {styles.container}>

    <div className={styles.links}>
      {links.map((link) => (
        <NavLink item={link} key={link.title} />
      ))}
      {session?.user ? (
        <>
          <form action = {handleLogout} >
          <button className={styles.logout}>Logout</button>
          </form>
        </>
      ) : (
        <NavLink item={{ title: "Login", path: "/login" }} />
      )}
    </div>
    <button className = {styles.menuButton} onClick  = {() => setOpen((prev) => !prev) }> Menu </button>
    {
      open && <div className = {styles.mobileLinks}>
        {links.map((link) => (
        <NavLink item={link} key={link.title} />))}
        </div>
    }
    </div>
  );
};

export default Links;
