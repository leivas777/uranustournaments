//CSS
import styles from "./Navbar.module.css";

//Router
import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <div className={styles.navbar}>
      <NavLink to="/" className={styles.brand}>
        <span>Uranus</span> Organizador de Torneios
      </NavLink>
      <ul className={styles.links_list}>
        <li>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? styles.isActive : "")}
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            className={({ isActive }) => (isActive ? styles.isActive : "")}
          >
            Torneios
          </NavLink>
        </li>
        <li>
          <NavLink
            className={({ isActive }) => (isActive ? styles.isActive : "")}
          >
            Sobre
          </NavLink>
        </li>
        <li>
          <button className={styles.login_btn}>
            <NavLink to='/login'>Login</NavLink>
          </button>
        </li>
        <li>
          <button className={styles.signUp_btn}>
            <NavLink to='/signup'>Inscrever-se</NavLink>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
