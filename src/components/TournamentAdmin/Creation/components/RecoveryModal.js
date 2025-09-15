import styles from "./RecoveryModal.module.css";

const RecoveryModal = ({ isOpen, onRecover, onDiscard, tournamentData }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>🔄 Torneio em Andamento</h3>
        </div>

        <div className={styles.modalBody}>
          <p>Encontramos um torneio que você estava criando:</p>

          <div className={styles.tournamentInfo}>
            <h4>📋 Informações Salvas:</h4>
            <ul>
              {tournamentData.basicInfo?.tournamentName && (
                <li>
                  <strong>Nome:</strong>{" "}
                  {tournamentData.basicInfo.tournamentName}
                </li>
              )}
              {tournamentData.basicInfo?.club && (
                <li>
                  <strong>Clube:</strong> {tournamentData.basicInfo.club}
                </li>
              )}
              {tournamentData.basicInfo?.cityName && (
                <li>
                  <strong>Cidade:</strong> {tournamentData.basicInfo.cityName}
                </li>
              )}
            </ul>
          </div>

          <p>Deseja continuar de onde parou ou começar um novo torneio?</p>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.recoverBtn} onClick={onRecover}>
            🔄 Continuar Torneio
          </button>
          <button className={styles.discardBtn} onClick={onDiscard}>
            🗑️ Começar Novo
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoveryModal;
