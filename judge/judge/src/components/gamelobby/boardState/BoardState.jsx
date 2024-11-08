
import styles from "./boardstate.module.css"
const BoardState =  async () => {
    return (
        <div className = {styles.rightbox}>
                <div className = {styles.rightboxhalfupper}>
                <span className = {styles.bignumbergood} > {0 }</span>
                </div>
             <div className = {styles.rightboxhalflower}>
                <span className  =  {styles.bignumberevil}> {0 }</span>
             </div>
        </div>
    )
}
export default  BoardState
