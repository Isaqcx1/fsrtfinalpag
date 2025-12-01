import { useNavigate } from "react-router-dom";

import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-container">

      
      <header className="login-header">
        <img src="/imgs/UrbanVibeL.png" className="login-logo" alt="Logo" />

        <h1 className="login-title">Inicio de Sesion</h1>

       
        <img
          src="/imgs/back.png"
          className="login-back"
          alt="Volver"
          onClick={() => navigate("/")}
        />
      </header>

     
      <main className="login-main">
        <img src="/imgs/icono.png" className="login-user-img" alt="Usuario" />

        <h2 className="login-user-text">Administrador</h2>

        <button
          className="login-btn"
          onClick={() => navigate("/productos-admin")}
        >
          Iniciar Sesion
        </button>
      </main>

    </div>
  );
}

export default Login;
