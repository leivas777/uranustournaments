//CSS
import styles from "./AdminLogin.module.css";

const AdminLogin = () => {
  return (
    <div className={styles.login_main}>
      <div className={styles.login_title}>
        <h1>LOGIN de Administrador</h1>
      </div>
      <div className={styles.login_container}>
        <div className={styles.title}>
          <h3>Efetue seu login</h3>
          <h4>Efetue seu login para ver os torneios que você organizou</h4>
          <h5>
            Caso ainda não tenha conta, clique <span>aqui</span>
          </h5>
        </div>
        <div className={styles.login_data}>
          <div className={styles.social_login}>
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
              <span>Senha:</span>
              <input
                type="password"
                name="password"
                required
                placeholder="Insira sua senha"
              />
            </label>
            <button className="saveBtn">Entrar</button>
            <button className="cancelBtn">Cancelar</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
