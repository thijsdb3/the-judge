import styles from "./deck.module.css"
import Image from "next/image"

const Deck = async () => {
return(
<div className={styles.bigbox}>
      <div className={styles.leftbox}>
        <Image 
          src="/images/cards.png" 
          alt="Deck of Cards"
          layout="responsive"  
          width={100}          
          height={150}         
        />
        <div className={styles.deckinfo}>
          <p className={styles.deckinfop}>Cards left in deck:</p>
          <div className={styles.smallbox}>
            <span className={styles.bignumber}>{34}</span>
          </div>
        </div>
      </div>
           
      </div>
      )
}


export default Deck