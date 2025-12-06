import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/recibo.css"; 

function Recibo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pedidoId } = location.state || {};

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!pedidoId) return;

    const cargarRecibo = async () => {
      try {
        const res = await fetch(`http://localhost:4000/dashboard/venta/${pedidoId}`);
        const info = await res.json();
        setData(info);
      } catch (error) {
        console.error("Error cargando recibo:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarRecibo();
  }, [pedidoId]);

  // 🔧 FIX FECHAS — normaliza formato "YYYY-MM-DD HH:mm:ss"
  const parseFecha = (f) => {
    if (!f) return new Date();
    const normalizada = f.includes(" ") ? f.replace(" ", "T") : f;
    return new Date(normalizada);
  };

  const formatearFecha = (f) =>
    parseFecha(f).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatearHora = (f) =>
    parseFecha(f).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (cargando) {
    return <div className="cargando">Cargando recibo...</div>;
  }

  if (!data) {
    return (
      <div className="recibo-container">
        <h2>Error al cargar recibo</h2>
        <button onClick={() => navigate("/")}>Volver</button>
      </div>
    );
  }

  const pedido = data.pedido;
  const pago = data.pago;

  return (
    <div className="recibo-wrapper printable">

      {/* HEADER */}
      <div className="recibo-header">
        <h1>RECIBO DE COMPRA</h1>
        <p>Pedido #{pedido.id_pedido}</p>
        <p>{formatearFecha(pedido.fecha_pedido)} — {formatearHora(pedido.fecha_pedido)}</p>
      </div>

      {/* CLIENTE */}
      <div className="recibo-section">
        <h2>Datos del Cliente</h2>
        <div className="grid">
          <div><strong>Nombre:</strong> {pedido.cliente_nombre}</div>
          <div><strong>Correo:</strong> {pedido.cliente_email}</div>
          <div><strong>Teléfono:</strong> {pedido.telefono || "N/A"}</div>
          <div><strong>Dirección:</strong> {pedido.direccion}</div>
        </div>
      </div>

      {/* PAGO */}
      {pago && (
        <div className="recibo-section">
          <h2>Pago</h2>
          <div className="grid">
            <div><strong>Método:</strong> {pago.metodo_pago}</div>
            <div><strong>Monto:</strong> S/ {parseFloat(pago.monto).toFixed(2)}</div>
            <div>
              <strong>Fecha:</strong> {formatearFecha(pago.fecha_pago)} — {formatearHora(pago.fecha_pago)}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTOS */}
      <div className="recibo-section">
        <h2>Productos Comprados</h2>

        <table className="recibo-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Talla</th>
              <th>Color</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {data.detalles.map((item, index) => (
              <tr key={index}>
                <td>{item.producto_nombre}</td>
                <td>{item.talla}</td>
                <td>{item.color_nombre}</td>
                <td>{item.cantidad}</td>
                <td>S/ {parseFloat(item.precio_unitario).toFixed(2)}</td>
                <td>S/ {parseFloat(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan="5" className="total-text">TOTAL</td>
              <td className="total-num">S/ {parseFloat(pedido.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* BOTONES */}
      <div className="recibo-botones no-print">
        <button className="btn-volver" onClick={() => navigate("/")}>
          Volver al inicio
        </button>

        <button className="btn-pdf" onClick={() => window.print()}>
          Descargar PDF
        </button>
      </div>
    </div>
  );
}

export default Recibo;
