import styles from "./HomePage.module.css";
import MakeGameButton from "@/components/HomePage/StartGameButton";
import JoinGameButton from "@/components/HomePage/JoinGameButton";

const HomePage = () => {
  return (
    <div className={styles.container}>
      <MakeGameButton />
      <JoinGameButton />
    </div>
  );
};

export default HomePage;
