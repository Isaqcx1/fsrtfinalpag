import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/verificacion.css";

function Verificacion() {

    const navigate = useNavigate();

    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Usuarios válidos
    const usuarios = {
        admin1: {
            password: "12345",
            redirect: "/productos-admin"
        },
        admin2: {
            password: "12345",
            redirect: "/dashboard"
        }
    };

    const manejarLogin = () => {
        if (!usuarios[usuario]) {
            setError("Usuario no registrado");
            return;
        }

        if (usuarios[usuario].password !== password) {
            setError("Contraseña incorrecta");
            return;
        }

        // todo correcto → redirigir según el usuario
        navigate(usuarios[usuario].redirect);
    };

    return (
        <div className="verificacion-container">
            <div className="verificacion-box">
                <h1>Inicio Sesion Administrador</h1>
                <h3>Ventas / Productos</h3>

                <label>Codigo de usuario</label>
                <input
                    type="text"
                    placeholder="coloca tu usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                />

                <label>Contraseña</label>
                <input
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="error-text">{error}</p>}

                <button onClick={manejarLogin}>Ingresar</button>
            </div>

            <img
                className="verificacion-img"
                src="/imgs/verificacion.png"
                alt="Fondo de formulario de verificación"
            />

        </div>
    );
}

export default Verificacion;
