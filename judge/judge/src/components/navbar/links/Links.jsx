"use client";
import styles from "./links.module.css";
import NavLink from "./navlinks/NavLink";
import { useState } from "react";
import { handleLogout } from "@/lib/action";

const links = [
  { title: "Homepage", path: "/" },
  { title: "Rules", path: "/rules" },
  { title: "Discord", path: "/discord" },
];

const Links = ({ session }) => {
  const [open, setOpen] = useState(false);

  return (
    <div >
      {/* Center Links */}
      <div className={styles.centerlinks}>
      {links.map((link) => (
  <NavLink item={link} key={link.title}  />
))}
      </div>

      {/* Right Links */}
      <div className={styles.rightLinks}>
        {session?.user ? (
          <>
            <form action={handleLogout}>
              <button className={styles.logout}>Logout</button>
            </form>
          </>
        ) : (
          <>
            {/* Signup Left of Login */}
            <div className = {styles.loginAndSignup}>
            <NavLink item={{ title: "Signup", path: "/signup" }} />
            <NavLink item={{ title: "Login", path: "/login" }} />
            </div>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      <button className={styles.menuButton} onClick={() => setOpen((prev) => !prev)}>
        Menu
      </button>

      {open && (
        <div className={styles.mobileLinks}>
          {session?.user ? (
            <>
              <form action={handleLogout}>
                <button className={styles.logout}>Logout</button>
              </form>
            </>
          ) : (
            <>
           <div className = {styles.loginAndSignup}>
              <NavLink item={{ title: "Signup", path: "/signup" }} />
              <NavLink item={{ title: "Login", path: "/login" }} />
              </div>
            </>
          )}
          {links.map((link) => (
            <NavLink item={link} key={link.title} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Links;
