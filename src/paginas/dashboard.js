import {
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Estilos de impresión para PDF
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .printable, .printable * {
      visibility: visible;
    }
    .printable {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
    button {
      display: none !important;
    }
  }
`;

if (typeof document !== "undefined") {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);
}

function Dashboard() {
    const navigate = useNavigate();

    const [periodo, setPeriodo] = useState("mes");
    const [estadisticas, setEstadisticas] = useState(null);
    const [ventasRecientes, setVentasRecientes] = useState([]);
    const [paginaVentas, setPaginaVentas] = useState(1);
    const [paginacionVentas, setPaginacionVentas] = useState({});
    const [parametrizaciones, setParametrizaciones] = useState([]);

    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [productosMasVendidos, setProductosMasVendidos] = useState([]);

    const [cargandoSeries, setCargandoSeries] = useState(false);
    const [serieVentas, setSerieVentas] = useState([]);


    // ------------------ Cargar estadísticas ------------------
    const cargarEstadisticas = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:4000/dashboard/ventas?periodo=${periodo}`);
            const data = await res.json();
            setEstadisticas(data);
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
        }
    }, [periodo]);

    // ------------------ 🔥 ARREGLO AQUÍ 🔥 ------------------
    const cargarVentasRecientes = useCallback(async () => {
        try {
            const res = await fetch(
                `http://localhost:4000/dashboard/ventas-recientes?periodo=${periodo}&page=${paginaVentas}`
            );

            const data = await res.json();

            // 🟩 Normalización correcta de fecha/hora
            const lista = (data.ventas || []).map(v => ({
                ...v,
                fecha_formateada: new Date(v.fecha_pedido).toLocaleDateString("es-PE"),
                hora_formateada: new Date(v.fecha_pedido).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit"
                })
            }));

            setVentasRecientes(lista);
            setPaginacionVentas(data.paginacion || {});

        } catch (error) {
            console.error("Error al cargar ventas recientes:", error);
        }
    }, [paginaVentas, periodo]);
    // ---------------------------------------------------------


    const cargarParametrizaciones = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:4000/parametrizaciones");
            const data = await res.json();
            setParametrizaciones(data);
        } catch (error) {
            console.error("Error al cargar parametrizaciones:", error);
        }
    }, []);

    const cargarCategorias = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:4000/categorias");
            const data = await res.json();
            setCategorias(data);
        } catch (error) {
            console.error("Error al cargar categorías:", error);
        }
    }, []);

    // Carga inicial
    useEffect(() => {
        const cargar = async () => {
            await Promise.all([
                cargarEstadisticas(),
                cargarVentasRecientes(),
                cargarParametrizaciones(),
                cargarCategorias()
            ]);
            setCargando(false);
        };
        cargar();
    }, [cargarEstadisticas, cargarVentasRecientes, cargarParametrizaciones, cargarCategorias]);

    // Cuando cambia el periodo
    useEffect(() => {
        cargarEstadisticas();
        cargarVentasRecientes();
    }, [periodo, cargarEstadisticas, cargarVentasRecientes]);






    // Funciones de acciones
    const handleActualizarParametro = async (id, nuevoValor) => {
        try {
            const res = await fetch(`http://localhost:4000/parametrizaciones/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ valor: parseFloat(nuevoValor) })
            });
            const data = await res.json();
            if (data.success) {
                alert("Parámetro actualizado correctamente");
                cargarParametrizaciones();
                cargarEstadisticas();
            } else {
                alert("Error al actualizar parámetro");
            }
        } catch (error) {
            console.error("Error al actualizar parámetro:", error);
            alert("Error al actualizar parámetro");
        }
    };






    const handleExportarPDF = () => {
        window.print();
    };

    const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString("es-PE");
    const formatearHora = (fecha) =>
        new Date(fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });


    // 🔥 Hooks SIEMPRE deben ir ANTES de cualquier return condicional
    const cargarSeriesVentas = useCallback(async () => {
        try {
            setCargandoSeries(true);
            const res = await fetch(`http://localhost:4000/dashboard/ventas-series?periodo=${periodo}`);

            if (!res.ok) {
                console.warn("ventas-series no disponible:", res.status);
                setSerieVentas([]);
                setCargandoSeries(false);
                return;
            }

            const data = await res.json();

            const formatted = data.map(d => {
                const dt = new Date(d.periodo);
                let label = "";

                if (periodo === "dia") {
                    label = dt.getHours().toString().padStart(2, "0") + ":00";
                } else if (periodo === "año") {
                    label = dt.toLocaleString("es-PE", { month: "short" });
                } else {
                    label = dt.getDate().toString().padStart(2, "0");
                }

                return { label, total: d.total };
            });

            setSerieVentas(formatted);
        } catch (error) {
            console.error(error);
            setSerieVentas([]);
        } finally {
            setCargandoSeries(false);
        }
    }, [periodo]);


    const cargarProductosTop = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:4000/dashboard/productos-mas-vendidos?periodo=${periodo}&limit=8`);
            if (!res.ok) {
                console.warn("productos-mas-vendidos no disponible");
                setProductosMasVendidos([]);
                return;
            }

            const data = await res.json();
            setProductosMasVendidos(data);
        } catch (error) {
            console.error(error);
            setProductosMasVendidos([]);
        }
    }, [periodo]);


    // Estos effects TAMBIÉN deben ir antes del return
    useEffect(() => {
        cargarSeriesVentas();
        cargarProductosTop();
    }, [periodo, cargarSeriesVentas, cargarProductosTop]);





    if (cargando) {
        return <div style={{ padding: "20px", fontSize: "18px" }}>Cargando dashboard...</div>;
    }










    return (
        <div style={styles.container} className="printable">
            <h1 style={styles.tituloPrincipal}>Dashboard de Ventas</h1>

            {/* 1. PANEL DE VENTAS */}
            <div style={styles.seccion}>
                <div style={styles.headerSeccion}>
                    <h2 style={styles.tituloSeccion}>Panel de Ventas</h2>
                    <div style={styles.controles}>
                        <div style={styles.filtros}>
                            <button
                                style={{
                                    ...styles.btnFiltro,
                                    ...(periodo === 'dia' ? styles.btnFiltroActivo : {})
                                }}
                                onClick={() => setPeriodo('dia')}
                            >
                                Último Día
                            </button>
                            <button
                                style={{
                                    ...styles.btnFiltro,
                                    ...(periodo === 'mes' ? styles.btnFiltroActivo : {})
                                }}
                                onClick={() => setPeriodo('mes')}
                            >
                                Último Mes
                            </button>
                            <button
                                style={{
                                    ...styles.btnFiltro,
                                    ...(periodo === 'año' ? styles.btnFiltroActivo : {})
                                }}
                                onClick={() => setPeriodo('año')}
                            >
                                Último Año
                            </button>
                        </div>
                        <button onClick={handleExportarPDF} style={styles.btnExportar} className="no-print">
                            📄 Exportar a PDF
                        </button>
                    </div>
                </div>

                {/* 3 Columnas de métricas */}
                <div style={styles.metricas}>
                    {/* Ventas Totales */}
                    <div style={styles.metrica}>
                        <h3 style={styles.metricaTitulo}>Ventas Totales</h3>
                        <div
                            style={{
                                ...styles.metricaValor,
                                color: estadisticas && estadisticas.ventas_totales >= estadisticas.parametros.minimo_ventas
                                    ? '#28a745'
                                    : '#dc3545'
                            }}
                        >
                            S/ {estadisticas?.ventas_totales.toFixed(2) || '0.00'}
                        </div>
                        <div style={styles.metricaSubtexto}>
                            Mínimo esperado: S/ {estadisticas?.parametros.minimo_ventas.toFixed(2) || '0.00'}
                        </div>
                    </div>

                    {/* Tasa de Crecimiento */}
                    <div style={styles.metrica}>
                        <h3 style={styles.metricaTitulo}>
                            {periodo === "dia"
                                ? "Tasa de Crecimiento Diaria"
                                : periodo === "mes"
                                    ? "Tasa de Crecimiento Mensual"
                                    : "Tasa de Crecimiento Anual"}
                        </h3>

                        <div
                            style={{
                                ...styles.metricaValor,
                                color: estadisticas && estadisticas.tasa_crecimiento >= estadisticas.parametros.tasa_crecimiento_minima
                                    ? '#28a745'
                                    : '#dc3545'
                            }}
                        >
                            {estadisticas?.tasa_crecimiento.toFixed(2) || '0.00'}%
                        </div>
                        <div style={styles.metricaSubtexto}>
                            Mínimo esperado: {estadisticas?.parametros.tasa_crecimiento_minima || 0}%
                        </div>
                    </div>

                    {/* Categorías Más Vendidas */}
                    <div style={styles.metrica}>
                        <h3 style={styles.metricaTitulo}>Categorías Más Vendidas</h3>
                        <div style={styles.categoriasLista}>
                            {estadisticas?.categorias_mas_vendidas && estadisticas.categorias_mas_vendidas.length > 0 ? (
                                estadisticas.categorias_mas_vendidas.map((cat, index) => (
                                    <div key={index} style={styles.categoriaItem}>
                                        <span style={styles.categoriaNombre}>{cat.categoria}</span>
                                        <span style={styles.categoriaMonto}>S/ {parseFloat(cat.total_vendido).toFixed(2)}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={styles.sinDatos}>No hay datos disponibles</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Gráfico pastel de categorías más vendidas */}
            <div style={{ width: "100%", height: 320, marginTop: 20 }}>
                <h3>Categorías más vendidas</h3>

                {estadisticas?.categorias_mas_vendidas?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={estadisticas.categorias_mas_vendidas.map(c => ({
                                    categoria: c.categoria,
                                    unidades:
                                        Number(c.unidades) ||
                                        Number(c.unidades_vendidas) ||
                                        Number(c.total_vendido) ||
                                        Number(c.cantidad) ||
                                        0
                                }))}
                                dataKey="unidades"
                                nameKey="categoria"
                                outerRadius={140}
                                label
                            >
                                {estadisticas.categorias_mas_vendidas.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={[
                                            "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
                                            "#A569BD", "#5DADE2", "#48C9B0", "#F4D03F",
                                            "#DC7633", "#EC7063", "#7F8C8D", "#2ECC71",
                                            "#1ABC9C", "#3498DB", "#9B59B6", "#E67E22"
                                        ][index % 16]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div>No hay datos disponibles</div>
                )}
            </div>









            <div style={{ width: "100%", height: 320, marginTop: 20 }}>
                <h3>Productos más vendidos</h3>
                {productosMasVendidos.length === 0 ? (
                    <div>No hay datos de productos</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productosMasVendidos}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="producto" />
                            <YAxis />
                            <Tooltip />

                            <Bar dataKey="unidades">
                                {productosMasVendidos.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={[
                                            "#0088FE",
                                            "#00C49F",
                                            "#FFBB28",
                                            "#FF8042",
                                            "#A569BD",
                                            "#5DADE2",
                                            "#48C9B0",
                                            "#F4D03F",
                                            "#DC7633",
                                            "#EC7063",
                                            "#7F8C8D",
                                            "#2ECC71",
                                            "#1ABC9C",
                                            "#3498DB",
                                            "#9B59B6",
                                            "#E67E22"
                                        ][index % 16]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
            <br></br>
            <br></br>
            <br></br>


            {/* 2. PANEL DE VENTAS RECIENTES */}
            <div style={styles.seccion}>

                <h2 style={styles.tituloSeccion}>
                    Ventas Recientes (
                    {periodo === "dia" ? "Hoy" : periodo === "mes" ? "Este Mes" : "Este Año"}
                    )
                </h2>

                <table style={styles.tabla}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Monto</th>
                            <th>Cliente</th>
                            <th>Método Pago</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {ventasRecientes.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={styles.sinDatos}>
                                    No hay ventas {periodo === "dia"
                                        ? "hoy"
                                        : periodo === "mes"
                                            ? "este mes"
                                            : "este año"}
                                </td>
                            </tr>
                        ) : (
                            ventasRecientes.map(venta => (
                                <tr key={venta.id_pedido}>

                                    {/* Fecha y hora formateadas */}
                                    <td>{formatearFecha(venta.fecha_pedido)}</td>
                                    <td>{formatearHora(venta.fecha_pedido)}</td>

                                    <td>S/ {parseFloat(venta.monto).toFixed(2)}</td>
                                    <td>{venta.cliente_nombre}</td>
                                    <td>{venta.metodo_pago}</td>
                                    <td>
                                        <button
                                            onClick={() =>
                                                navigate(`/dashboard/venta/${venta.id_pedido}`)
                                            }
                                            style={styles.btnVerDetalle}
                                            className="no-print"
                                        >
                                            Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>


            {/* 3. PARAMETRIZACIÓN DE INDICADORES */}
            <div style={styles.seccion}>
                <h2 style={styles.tituloSeccion}>Parametrización de Indicadores</h2>
                <div style={styles.parametrosContainer}>
                    {parametrizaciones.map(param => (
                        <div key={param.id_parametro} style={styles.parametroCard}>
                            <div style={styles.parametroInfo}>
                                <h3 style={styles.parametroNombre}>{param.nombre}</h3>
                                <p style={styles.parametroDescripcion}>{param.descripcion}</p>
                                <div style={styles.parametroValorActual}>
                                    Valor actual: {param.valor}
                                    {param.codigo === 'MINIMO_VENTAS_MENSUAL' ? ' S/' : ' %'}
                                </div>
                            </div>
                            <div style={styles.parametroAccion}>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Nuevo valor"
                                    style={styles.inputParametro}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleActualizarParametro(param.id_parametro, e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <button
                                    onClick={(e) => {
                                        const input = e.target.previousSibling;
                                        handleActualizarParametro(param.id_parametro, input.value);
                                        input.value = '';
                                    }}
                                    style={styles.btnActualizar}
                                    className="no-print"
                                >
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>




        </div>

    );
}

const styles = {
    container: {
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px"
    },
    cargando: {
        textAlign: "center",
        padding: "40px",
        fontSize: "18px"
    },
    tituloPrincipal: {
        fontSize: "32px",
        fontWeight: "bold",
        marginBottom: "30px"
    },
    seccion: {
        background: "#fff",
        padding: "25px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "30px"
    },
    headerSeccion: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "15px"
    },
    tituloSeccion: {
        fontSize: "24px",
        fontWeight: "bold",
        margin: 0
    },
    controles: {
        display: "flex",
        gap: "15px",
        alignItems: "center",
        flexWrap: "wrap"
    },
    filtros: {
        display: "flex",
        gap: "10px"
    },
    btnFiltro: {
        padding: "8px 16px",
        border: "1px solid #ccc",
        background: "#fff",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "14px"
    },
    btnFiltroActivo: {
        background: "#000",
        color: "#fff",
        borderColor: "#000"
    },
    btnExportar: {
        background: "#28a745",
        color: "#fff",
        padding: "8px 16px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "bold"
    },
    metricas: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
        marginTop: "20px"
    },
    metrica: {
        padding: "20px",
        background: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #dee2e6"
    },
    metricaTitulo: {
        fontSize: "16px",
        fontWeight: "bold",
        marginBottom: "15px",
        color: "#495057"
    },
    metricaValor: {
        fontSize: "32px",
        fontWeight: "bold",
        marginBottom: "10px"
    },
    metricaSubtexto: {
        fontSize: "12px",
        color: "#6c757d"
    },
    categoriasLista: {
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    },
    categoriaItem: {
        display: "flex",
        justifyContent: "space-between",
        padding: "8px",
        background: "#fff",
        borderRadius: "5px"
    },
    categoriaNombre: {
        fontWeight: "500"
    },
    categoriaMonto: {
        color: "#28a745",
        fontWeight: "bold"
    },
    tabla: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "15px"
    },
    sinDatos: {
        textAlign: "center",
        padding: "40px",
        color: "#999"
    },
    btnVerDetalle: {
        background: "#007bff",
        color: "#fff",
        padding: "5px 10px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px"
    },
    paginacion: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
        marginTop: "20px"
    },
    btnPagina: {
        padding: "8px 16px",
        border: "1px solid #ccc",
        background: "#fff",
        cursor: "pointer",
        borderRadius: "4px"
    },
    infoPagina: {
        fontSize: "14px",
        color: "#666"
    },
    parametrosContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "15px"
    },
    parametroCard: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px",
        background: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #dee2e6",
        flexWrap: "wrap",
        gap: "15px"
    },
    parametroInfo: {
        flex: 1,
        minWidth: "300px"
    },
    parametroNombre: {
        fontSize: "18px",
        fontWeight: "bold",
        marginBottom: "5px"
    },
    parametroDescripcion: {
        fontSize: "14px",
        color: "#6c757d",
        marginBottom: "10px"
    },
    parametroValorActual: {
        fontSize: "14px",
        fontWeight: "500"
    },
    parametroAccion: {
        display: "flex",
        gap: "10px",
        alignItems: "center"
    },
    inputParametro: {
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        width: "150px"
    },
    btnActualizar: {
        background: "#007bff",
        color: "#fff",
        padding: "8px 16px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
    },
    btnNuevo: {
        background: "#000",
        color: "#fff",
        padding: "8px 16px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "14px"
    },
    formPromocion: {
        marginTop: "20px",
        padding: "20px",
        background: "#f8f9fa",
        borderRadius: "8px"
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "15px",
        marginBottom: "15px"
    },
    label: {
        display: "block",
        fontSize: "14px",
        fontWeight: "bold",
        marginBottom: "5px"
    },
    input: {
        width: "100%",
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px"
    },
    select: {
        width: "100%",
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        background: "#fff"
    },
    btnGuardar: {
        background: "#28a745",
        color: "#fff",
        padding: "10px 20px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "bold"
    },
    subtitulo: {
        fontSize: "18px",
        fontWeight: "bold",
        marginTop: "20px",
        marginBottom: "15px"
    },
    btnEliminar: {
        background: "#dc3545",
        color: "#fff",
        padding: "5px 10px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px"
    }
};

export default Dashboard;

