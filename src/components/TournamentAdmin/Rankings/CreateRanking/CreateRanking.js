import { useState } from "react";
import styles from "../Rankings.module.css";

const CreateRanking = () => {
  const [rankingType, setRankingType] = useState("");

  const handleType = (type) => {};

  return (
    <div className={styles.body}>
      <div className={styles.header}>
        <h4>Crie seu ranking:</h4>
        <p>
          Rankings são torneios contínuos ou por etapas e que apresentam o
          ranking dos atletas que os disputam.
        </p>
      </div>
      <div className={styles.container}>
        <div className={styles.containerData}>
          <div className={styles.title}>
            <h6>Criar Ranking</h6>
            <h6>1</h6>
          </div>
          <div className={styles.formTitle}>
            <h7>Dados Gerais</h7>
          </div>
          <div className={styles.formData}>
            <form>
              <label>
                <span>Tipo:</span>
                <select>
                  <option>Etapas</option>
                  <option>Contínuo</option>
                </select>
              </label>
              <label>
                <span>Esporte:</span>
                <select>
                  <option>Tênis</option>
                  <option>Beach Tênis</option>
                  <option>Padel</option>
                  <option>Pickleball</option>
                </select>
              </label>
              <label>
                <span>Modalidade:</span>
                <select>
                  <option>Simples</option>
                  <option>Duplas</option>
                </select>
              </label>
              <label>
                <span>Nome do Ranking:</span>
                <input type="text" placeholder="Insira o nome do torneio" />
              </label>
              <label>
                <span>Quantidade Participantes:</span>
                <input type="number" />
              </label>
              <div className={styles.location}>
                <label>Localização:</label>
                <div className={styles.locationData}>
                  <label>
                    <span>Estado:</span>
                    <select>
                      <option>RS</option>
                      <option>SC</option>
                      <option>PR</option>
                    </select>
                  </label>
                  <label>
                    <span>Cidade:</span>
                    <select>
                      <option>Santa Cruz do Sul</option>
                    </select>
                  </label>
                  <label>
                    <span>Clube:</span>
                    <input type="text" />
                  </label>
                </div>
              </div>
              
            </form>
            <div className={styles.buttons}>
              <button className="saveBtn">Prosseguir</button>
              <button className="cancelBtn">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRanking;
