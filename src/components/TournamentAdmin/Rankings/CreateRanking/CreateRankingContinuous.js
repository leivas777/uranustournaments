import styles from '../Rankings.module.css'

const CreateRankingContinuous = () => {
  return (
    <div><label>
                    <span>Classes:</span>
                    <div className={styles.classes}>
                      <label>
                        <input type="checkbox" name="classA" />A
                      </label>
                      <label>
                        <input type="checkbox" name="classB" />B
                      </label>
                      <label>
                        <input type="checkbox" name="classC" />C
                      </label>
                      <label>
                        <input type="checkbox" name="classD" />D
                      </label>
                      <label>
                        <input type="checkbox" name="classE" />E
                      </label>
                      <label>
                        <input type="checkbox" name="classIniciantes" />
                        Iniciantes
                      </label>
                    </div>
                  </label></div>
  )
}

export default CreateRankingContinuous