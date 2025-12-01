import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const IMAGEN_DEFAULT = "/imgs/ropazz.png";

function ProductosAdmin() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [paginacion, setPaginacion] = useState({
    pagina_actual: 1,
    total_paginas: 1,
    total_productos: 0,
    productos_por_pagina: 10
  });
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [paginaActual, categoriaFiltro]);

  const cargarCategorias = async () => {
    try {
      const res = await fetch("http://localhost:4000/categorias");
      const data = await res.json();
      setCategorias(data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const cargarProductos = async () => {
    setCargando(true);
    try {
      let url = `http://localhost:4000/productos-admin?page=${paginaActual}`;
      if (categoriaFiltro) {
        url += `&categoria_id=${categoriaFiltro}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setProductos(data.productos || []);
      setPaginacion(data.paginacion || paginacion);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
  if (!window.confirm("¿Seguro que desea eliminar este producto? Esta acción no se puede deshacer.")) {
    return;
  }

  try {
    const res = await fetch(`http://localhost:4000/productos-admin/delete/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      alert("Producto eliminado correctamente");
      cargarProductos();
    } else {
      alert("No se pudo eliminar el producto");
    }
  } catch (error) {
    console.error("Error al eliminar:", error);
    alert("Error al eliminar producto");
  }
};




  const handleEditar = (id) => {
    navigate(`/productos-admin/editar/${id}`);
  };

  const handleNuevo = () => {
    navigate("/productos-admin/nuevo");
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= paginacion.total_paginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>Mantenimiento de Productos</h1>
        <button onClick={handleNuevo} style={styles.btnNuevo}>
          + Nuevo Producto
        </button>
      </div>

      {/* Filtros por categoría */}
      <div style={styles.filtrosBar}>
        <button
          style={{
            ...styles.filtroBtn,
            ...(categoriaFiltro === null ? styles.filtroBtnActivo : {})
          }}
          onClick={() => {
            setCategoriaFiltro(null);
            setPaginaActual(1);
          }}
        >
          Todas
        </button>
        {categorias.map(cat => (
          <button
            key={cat.id_categoria}
            style={{
              ...styles.filtroBtn,
              ...(categoriaFiltro === cat.id_categoria ? styles.filtroBtnActivo : {})
            }}
            onClick={() => {
              setCategoriaFiltro(cat.id_categoria);
              setPaginaActual(1);
            }}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Tabla de productos */}
      {cargando ? (
        <div style={styles.cargando}>Cargando...</div>
      ) : (
        <>
          <div style={styles.tablaContainer}>
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Tallas</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={styles.sinDatos}>
                      No hay productos disponibles
                    </td>
                  </tr>
                ) : (
                  productos.map(p => (
                    <tr key={p.id_producto}>
                      <td>{p.id_producto}</td>
                      <td>
                        <img
                          src={p.imagen || IMAGEN_DEFAULT}
                          alt={p.nombre}
                          style={styles.imagenTabla}
                        />
                      </td>
                      <td>{p.nombre}</td>
                      <td>S/ {parseFloat(p.precio).toFixed(2)}</td>
                      <td>
                        <span
                          style={{
                            ...styles.badge,
                            ...(p.estado === "Activo"
                              ? styles.badgeActivo
                              : p.estado === "Inactivo"
                                ? styles.badgeInactivo
                                : styles.badgePendiente)
                          }}
                        >
                          {p.estado}
                        </span>
                      </td>
                      <td>{p.tallas || "-"}</td>
                      <td>{p.categoria}</td>
                      <td>{p.stock_total || 0}</td>
                      <td>
                        <div style={styles.acciones}>
                          <button
                            onClick={() => handleEditar(p.id_producto)}
                            style={styles.btnEditar}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(p.id_producto)}
                            style={styles.btnEliminar}
                          >
                            Eliminar
                          </button>



                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {paginacion.total_paginas > 1 && (
            <div style={styles.paginacion}>
              <button
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                style={styles.btnPagina}
              >
                Anterior
              </button>
              <span style={styles.infoPagina}>
                Página {paginacion.pagina_actual} de {paginacion.total_paginas}
                {" "}({paginacion.total_productos} productos)
              </span>
              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === paginacion.total_paginas}
                style={styles.btnPagina}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "20px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  titulo: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0
  },
  btnNuevo: {
    background: "#000",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold"
  },
  filtrosBar: {
    display: "flex",
    gap: "10px",
    padding: "15px 0",
    borderBottom: "1px solid #ccc",
    background: "#fafafa",
    marginBottom: "20px",
    flexWrap: "wrap"
  },
  filtroBtn: {
    background: "transparent",
    border: "1px solid #ccc",
    fontSize: "14px",
    cursor: "pointer",
    padding: "8px 15px",
    color: "#444",
    borderRadius: "5px"
  },
  filtroBtnActivo: {
    borderBottom: "3px solid black",
    fontWeight: "bold",
    color: "black",
    background: "#fff"
  },
  tablaContainer: {
    overflowX: "auto",
    marginBottom: "20px"
  },
  tabla: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  imagenTabla: {
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "5px"
  },
  badge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold"
  },
  badgeActivo: {
    background: "#d4edda",
    color: "#155724"
  },
  badgeInactivo: {
    background: "#f8d7da",
    color: "#721c24"
  },
  badgePendiente: {
    background: "#fff3cd",
    color: "#856404"
  },
  acciones: {
    display: "flex",
    gap: "5px"
  },
  btnEditar: {
    background: "#007bff",
    color: "#fff",
    padding: "5px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px"
  },
  btnEliminar: {
    background: "#dc3545",
    color: "#fff",
    padding: "5px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px"
  },
  sinDatos: {
    textAlign: "center",
    padding: "40px",
    color: "#999"
  },
  cargando: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px"
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
  }
};

export default ProductosAdmin;

