//CSS
import styles from "./AdminHome.module.css";

//React
import { useState } from "react";
//Components

import AdminNavbar from "../../components/AdminNavbar/AdminNavbar";
import AdminData from "../../components/TournamentAdmin/AdminData/AdminData";
import TournamentCreation from "../../components/TournamentAdmin/Creation/TournamentCreation";

const AdminHome = () => {
  const [activeComponent, setActiveComponent] = useState("data");

  const renderComponent = () => {
    switch (activeComponent) {
      case "data":
        return <AdminData />;
      case "createTournament":
        return <TournamentCreation tournamentType={"torneio"} />;
      case "createRanking":
        return <TournamentCreation tournamentType={"ranking"} />;
      case "createSuper":
        return <TournamentCreation tournamentType={"super"} />;
      default:
        return <AdminData />;
    }
  };

  return (
    <div className={styles.adminHome_main}>
      <div className={styles.adminHome_titleContainer}>
        <h3>Sua Home</h3>
      </div>
      <AdminNavbar setActiveComponent={setActiveComponent} />
      <div>{renderComponent()}</div>
    </div>
  );
};

export default AdminHome;
