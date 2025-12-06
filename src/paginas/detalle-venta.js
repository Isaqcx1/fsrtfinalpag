import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/detalleVenta.css";

function DetalleVenta() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [venta, setVenta] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarDetalleVenta = async () => {
            try {
                const res = await fetch(`http://localhost:4000/dashboard/venta/${id}`);
                const data = await res.json();
                setVenta(data);
            } catch (error) {
                console.error("Error al cargar detalle de venta:", error);
                alert("Error al cargar el detalle de la venta");
            } finally {
                setCargando(false);
            }
        };

        cargarDetalleVenta();
    }, [id]);

    const formatearFecha = (fecha) => {
        const d = new Date(fecha);
        return d.toLocaleDateString("es-PE", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatearHora = (fecha) => {
        const d = new Date(fecha);
        return d.toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (cargando) {
        return <div className="cargando">Cargando detalle de venta...</div>;
    }

    if (!venta) {
        return (
            <div className="contenedor">
                <div className="error">No se pudo cargar el detalle de la venta</div>
                <button onClick={() => navigate("/dashboard")} className="btn-volver">
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="contenedor printable">
            {/* ENCABEZADO */}
            <div className="header no-print">
                <h1 className="titulo">Detalle de Venta #{venta.pedido.id_pedido}</h1>

                <div className="acciones">
                    <button onClick={() => navigate("/dashboard")} className="btn-volver">
                        ← Volver
                    </button>

                    <button onClick={() => window.print()} className="btn-pdf no-print">
                        📄 Descargar PDF
                    </button>
                </div>
            </div>

            {/* INFO PEDIDO */}
            <div className="seccion">
                <h2 className="titulo-seccion">Información del Pedido</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <label>Fecha:</label>
                        <span>{formatearFecha(venta.pedido.fecha_pedido)}</span>
                    </div>
                    <div className="info-item">
                        <label>Hora:</label>
                        <span>{formatearHora(venta.pedido.fecha_pedido)}</span>
                    </div>
                    <div className="info-item">
                        <label>Estado:</label>
                        <span>{venta.pedido.estado}</span>
                    </div>
                    <div className="info-item">
                        <label>Total:</label>
                        <span>S/ {parseFloat(venta.pedido.total).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* INFO CLIENTE */}
            <div className="seccion">
                <h2 className="titulo-seccion">Información del Cliente</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <label>Nombre:</label>
                        <span>{venta.pedido.cliente_nombre}</span>
                    </div>
                    <div className="info-item">
                        <label>Email:</label>
                        <span>{venta.pedido.cliente_email}</span>
                    </div>
                    <div className="info-item">
                        <label>Teléfono:</label>
                        <span>{venta.pedido.telefono || "N/A"}</span>
                    </div>
                    <div className="info-item">
                        <label>Dirección:</label>
                        <span>{venta.pedido.direccion}</span>
                    </div>
                </div>
            </div>

            {/* INFO PAGO */}
            {venta.pago && (
                <div className="seccion">
                    <h2 className="titulo-seccion">Información del Pago</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Método:</label>
                            <span>{venta.pago.metodo_pago}</span>
                        </div>
                        <div className="info-item">
                            <label>Monto:</label>
                            <span>S/ {parseFloat(venta.pago.monto).toFixed(2)}</span>
                        </div>
                        <div className="info-item">
                            <label>Fecha de Pago:</label>
                            <span>
                                {formatearFecha(venta.pago.fecha_pago)} - {formatearHora(venta.pago.fecha_pago)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* DETALLES DEL PEDIDO */}
            <div className="seccion">
                <h2 className="titulo-seccion">Detalles del Pedido</h2>

                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Talla</th>
                            <th>Color</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>

                    <tbody>
                        {venta.detalles.map((detalle, index) => (
                            <tr key={index}>
                                <td>
                                    <div className="producto-info">
                                        {detalle.producto_imagen && (
                                            <img
                                                src={detalle.producto_imagen}
                                                alt={detalle.producto_nombre}
                                                className="producto-imagen"
                                            />
                                        )}
                                        <span>{detalle.producto_nombre}</span>
                                    </div>
                                </td>
                                <td>{detalle.categoria}</td>
                                <td>{detalle.talla}</td>
                                <td>{detalle.color_nombre}</td>
                                <td>{detalle.cantidad}</td>
                                <td>S/ {parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                <td>S/ {parseFloat(detalle.subtotal).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>

                    <tfoot>
                        <tr>
                            <td colSpan="6" className="total-label">Total:</td>
                            <td className="total-valor">
                                S/ {parseFloat(venta.pedido.total).toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export default DetalleVenta;
