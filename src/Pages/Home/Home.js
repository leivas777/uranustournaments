//CSS
import styles from "./Home.module.css";

//Router
import { Link } from "react-router-dom";


const Home = () => {
  return (
    <div className={styles.main}>
      <div>
        <h1>Uranus</h1>
        <h5>Seu organizador de torneios favoritos</h5>
      </div>
      <div className={styles.admin_container}>
        <div className={styles.admin_title}>
            <h4>Quer organizar o seu torneio?</h4>
            <h5>Faça seu cadastro <Link to='/adminSignup'>aqui</Link></h5>
            <h5>Se já possui cadastro, clique <Link to='adminLogin'>aqui</Link></h5>
        </div>
      </div>
    </div>
  );
};

export default Home;
