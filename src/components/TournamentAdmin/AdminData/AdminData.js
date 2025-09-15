import styles from "./AdminData.module.css";

const AdminData = () => {
  return (
    <div className={styles.club_data}>
      <div className={styles.title}>
        <h6>Dados do Clube</h6>
      </div>
      <div className={styles.modules}>
        <div className={styles.title}>
          <h6>Módulos Ativos:</h6>
        </div>
        <div className={styles.modules_data}>
          <div className={styles.module}>
            <p>Módulo Ativo</p>
          </div>
          <div className={styles.module}>
            <p>Módulo Inativo</p>
          </div>
        </div>
      </div>
      <div className={styles.formData}>
        <form>
            <label>
                <span>País:</span>
                <select>
                    <option>Brasil</option>
                    <option>Argentina</option>
                    <option>Uruguai</option>
                </select>
            </label>
            <label>
                <span>CPF/CNPJ:</span>
                <input
                type="text"
                name="document"
                pattern="\d{11}|\d{14}"
                title="Digite um CPF (11 Dígitos) ou CNPJ (14 Dígitos)"
                required
                />
            </label>
            <label>
                <span>Nome:</span>
                <input
                type="text"
                name="userName"
                required
                />
            </label>
            <label>
                <span>Nome Fantasia:</span>
                <input
                type="text"
                name="commonName"
                />
            </label>
            <label>
                <span>Razão Social:</span>
                <input
                type="text"
                name="socialName"
                />
            </label>
            <label>
                <span>E-mail Contato:</span>
                <input
                type="email"
                name="contactEmail"
                required
                />
            </label>
            <label>
                <span>Telefone Contato:</span>
                <input
                type="phone"
                name="contactPhone"
                required
                />
            </label>
                        <label>
                <span>E-mail Financeiro:</span>
                <input
                type="email"
                name="financeEmail"
                required
                />
            </label>
            <label>
                <span>Telefone Financeiro:</span>
                <input
                type="phone"
                name="financePhone"
                required
                />
            </label>
        </form>


      </div>    
    </div>
  );
};

export default AdminData;
