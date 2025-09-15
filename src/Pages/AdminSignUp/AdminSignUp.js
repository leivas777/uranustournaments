
import styles from "./AdminSignUp.module.css";

const AdminSignUp = () => {
  return (
    <div className={styles.signup_main}>
      <div className={styles.signup_title}>
        <h1>Registro de Administrador</h1>
        <h3>Registre-se para poder criar o seu torneio</h3>
      </div>
      <div className={styles.signup_container}>
        <div className={styles.signup_data}>
        <div className={styles.social_signup}>
          <p>Google</p>
          <p>Facebook</p>
          <p>Apple</p>
        </div>
        <form>
          <label>
            <span>E-mail:</span>
            <input
              type="email"
              name="email"
              required
              placeholder="Insira seu e-mail"
            />
          </label>
          <label>
            <span>Confirme seu E-mail:</span>
            <input
              type="email"
              name="emailConfirmation"
              required
              placeholder="Confirme seu e-mail"
            />
          </label>
          <label>
            <span>Senha:</span>
            <input
              type="password"
              name="password"
              required
              placeholder="Insira sua senha"
            />
          </label>
          <label>
            <span>Confirme a Senha:</span>
            <input
              type="password"
              name="passwordConfirmation"
              required
              placeholder="Confirme sua senha"
            />
          </label>
          <button className="saveBtn">Registrar</button>
          <button className="cancelBtn">Cancelar</button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSignUp;
