import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
    }, [id]); // <-- YA NO FALTA NADA



    const formatearFecha = (fecha) => {
        const d = new Date(fecha);
        return d.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearHora = (fecha) => {
        const d = new Date(fecha);
        return d.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (cargando) {
        return <div style={styles.cargando}>Cargando detalle de venta...</div>;
    }

    if (!venta) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>No se pudo cargar el detalle de la venta</div>
                <button onClick={() => navigate("/dashboard")} style={styles.btnVolver}>
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.titulo}>Detalle de Venta #{venta.pedido.id_pedido}</h1>
                <button onClick={() => navigate("/dashboard")} style={styles.btnVolver}>
                    ← Volver al Dashboard
                </button>
            </div>

            {/* Información del Pedido */}
            <div style={styles.seccion}>
                <h2 style={styles.tituloSeccion}>Información del Pedido</h2>
                <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Fecha:</span>
                        <span style={styles.infoValor}>{formatearFecha(venta.pedido.fecha_pedido)}</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Hora:</span>
                        <span style={styles.infoValor}>{formatearHora(venta.pedido.fecha_pedido)}</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Estado:</span>
                        <span style={styles.infoValor}>{venta.pedido.estado}</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Total:</span>
                        <span style={styles.infoValor}>S/ {parseFloat(venta.pedido.total).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Información del Cliente */}
            <div style={styles.seccion}>
                <h2 style={styles.tituloSeccion}>Información del Cliente</h2>
                <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Nombre:</span>
                        <span style={styles.infoValor}>{venta.pedido.cliente_nombre}</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Email:</span>
                        <span style={styles.infoValor}>{venta.pedido.cliente_email}</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Teléfono:</span>
                        <span style={styles.infoValor}>{venta.pedido.telefono || 'N/A'}</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Dirección:</span>
                        <span style={styles.infoValor}>{venta.pedido.direccion}</span>
                    </div>
                </div>
            </div>

            {/* Información del Pago */}
            {venta.pago && (
                <div style={styles.seccion}>
                    <h2 style={styles.tituloSeccion}>Información del Pago</h2>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Método de Pago:</span>
                            <span style={styles.infoValor}>{venta.pago.metodo_pago}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Monto:</span>
                            <span style={styles.infoValor}>S/ {parseFloat(venta.pago.monto).toFixed(2)}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Fecha de Pago:</span>
                            <span style={styles.infoValor}>
                                {formatearFecha(venta.pago.fecha_pago)} {formatearHora(venta.pago.fecha_pago)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Detalles del Pedido */}
            <div style={styles.seccion}>
                <h2 style={styles.tituloSeccion}>Detalles del Pedido</h2>
                <table style={styles.tabla}>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Talla</th>
                            <th>Color</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {venta.detalles.map((detalle, index) => (
                            <tr key={index}>
                                <td>
                                    <div style={styles.productoInfo}>
                                        {detalle.producto_imagen && (
                                            <img
                                                src={detalle.producto_imagen}
                                                alt={detalle.producto_nombre}
                                                style={styles.productoImagen}
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
                            <td colSpan="6" style={styles.totalLabel}>Total:</td>
                            <td style={styles.totalValor}>S/ {parseFloat(venta.pedido.total).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px"
    },
    cargando: {
        textAlign: "center",
        padding: "40px",
        fontSize: "18px"
    },
    error: {
        textAlign: "center",
        padding: "40px",
        fontSize: "18px",
        color: "#dc3545"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px"
    },
    titulo: {
        fontSize: "28px",
        fontWeight: "bold",
        margin: 0
    },
    btnVolver: {
        background: "#6c757d",
        color: "#fff",
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px"
    },
    seccion: {
        background: "#fff",
        padding: "25px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "20px"
    },
    tituloSeccion: {
        fontSize: "20px",
        fontWeight: "bold",
        marginBottom: "20px"
    },
    infoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "15px"
    },
    infoItem: {
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    infoLabel: {
        fontSize: "14px",
        color: "#6c757d",
        fontWeight: "500"
    },
    infoValor: {
        fontSize: "16px",
        fontWeight: "bold"
    },
    tabla: {
        width: "100%",
        borderCollapse: "collapse"
    },
    productoInfo: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    productoImagen: {
        width: "50px",
        height: "50px",
        objectFit: "cover",
        borderRadius: "5px"
    },
    totalLabel: {
        textAlign: "right",
        fontWeight: "bold",
        fontSize: "18px"
    },
    totalValor: {
        fontWeight: "bold",
        fontSize: "18px",
        color: "#28a745"
    }
};

export default DetalleVenta;

