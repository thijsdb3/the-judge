//import styles from "./gamechat.module.css";

const Gamechat = () => {
  const gameMessages = ["Waiting on players...","game can be started once there are between 6 and 13 players in lobby","If you want to be the Judge click the volunteer button"];

  return (
    <div className={styles.chatWindow}>
    <div className={styles.navbar}>
      <button className={styles.tab}>Game Messages</button>
    </div>
    <div className={styles.messages}>
      <ul>
        {gameMessages.map((message, index) => (
          <li key={index} className={styles.message}>
            {message}
          </li>
        ))}
      </ul>
    </div>
  </div>
);
};

export default Gamechat;
