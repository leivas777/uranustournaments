//CSS
import "./App.css";

//Router
import { BrowserRouter, Routes, Route } from "react-router-dom";

//Pages
import Home from "./Pages/Home/Home.js";
import Login from "./Pages/Login/Login.js";

//Components
import Navbar from "./components/Navbar/Navbar.js";
import SignUp from "./Pages/SignUp/SignUp.js";
import AdminLogin from "./Pages/AdminLogin/AdminLogin.js";
import ClientCreation from "./Pages/MasterAdmin/Creation/Client/ClientCreation.js"
import AdminHome from "./Pages/AdminHome/AdminHome.js";

//Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/adminLogin" element={<AdminLogin />} />
          <Route path="/adminHome" element={<AdminHome/>}/>
          <Route path="/client-creation" element={<ClientCreation/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
