import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function PagoFinal2() {
  const navigate = useNavigate();
  const location = useLocation();

  const { pedidoId, total, items } = location.state;

  const [metodo, setMetodo] = useState("tarjeta");

  const guardarPago = async () => {
  if (!metodo) return alert("Selecciona un método de pago");

  try {
    const response = await fetch("http://localhost:4000/pedido-completar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pedido_id: pedidoId,      
        metodo_pago: metodo,      
        total: total,            
        items: items              
      }),
    });

    const data = await response.json();

    if (!data.success) {
      alert("Error al registrar el pago");
      return;
    }

    alert("Pago registrado correctamente");

    navigate("/recibo", {
      state: { pedidoId },
    });

  } catch (error) {
    console.log(error);
    alert("Error al conectar con el servidor");
  }
};


  return (
    <div style={{ width: "80%", margin: "auto", marginTop: 40 }}>
      <h2>PAGO</h2>
      <p>Todas las transacciones son seguras</p>

      <div style={{ marginTop: 30 }}>
        <label>
          <input
            type="radio"
            name="pago"
            value="tarjeta"
            checked={metodo === "tarjeta"}
            onChange={() => setMetodo("tarjeta")}
          />
          Tarjeta de crédito o débito
        </label>
        <br />

        <label>
          <input
            type="radio"
            name="pago"
            value="yape"
            checked={metodo === "yape"}
            onChange={() => setMetodo("yape")}
          />
          Yape
        </label>
        <br />

        <label>
          <input
            type="radio"
            name="pago"
            value="plin"
            checked={metodo === "plin"}
            onChange={() => setMetodo("plin")}
          />
          Plin
        </label>
        <br />

        <label>
          <input
            type="radio"
            name="pago"
            value="efectivo"
            checked={metodo === "efectivo"}
            onChange={() => setMetodo("efectivo")}
          />
          Pago en efectivo
        </label>
      </div>

      <hr style={{ margin: "30px 0" }} />

      
      {metodo === "tarjeta" && (
        <div style={styles.box}>
          <h4>Tarjeta de crédito o débito</h4>

          <input style={styles.input} placeholder="Número de tarjeta" />
          <input style={styles.input} placeholder="Nombre del titular" />

          <div style={{ display: "flex", gap: 20 }}>
            <input style={{ ...styles.input, width: "50%" }} placeholder="mm/aa" />
            <input style={{ ...styles.input, width: "50%" }} placeholder="CVV" />
          </div>
        </div>
      )}

      {metodo === "yape" && (
        <div style={styles.box}>
          <h4>Pago con Yape</h4>
          <input style={styles.input} placeholder="Número de celular" />
          <input style={styles.input} placeholder="Código Yape (si aplica)" />
        </div>
      )}

      {metodo === "plin" && (
        <div style={styles.box}>
          <h4>Pago con Plin</h4>
          <input style={styles.input} placeholder="Número de celular" />
          <input style={styles.input} placeholder="Nombre del titular" />
        </div>
      )}

      {metodo === "efectivo" && (
        <div style={styles.box}>
          <h4>Pago en efectivo</h4>
          <p>
            El pago se realizará en efectivo contra entrega.
            Guarda bien tu número de pedido.
          </p>
        </div>
      )}

      <button
        onClick={guardarPago}
        style={{
          marginTop: 30,
          padding: "10px 20px",
          background: "black",
          color: "white",
        }}
      >
        CONFIRMAR PAGO
      </button>
    </div>
  );
}

const styles = {
  box: {
    padding: 20,
    background: "#f3f3f3",
    borderRadius: 10,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 15,
    border: "1px solid #aaa",
  },
};

export default PagoFinal2;
