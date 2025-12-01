import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const IMAGEN_DEFAULT = "/imgs/ropazz.png";

function ProductoForm() {
  const { id } = useParams();
  const esEdicion = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    estado: "Activo",
    categoria_id: "",
    tallas_ids: [],
    colores_ids: [],
    imagen: ""
  });

  const [categorias, setCategorias] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [colores, setColores] = useState([]);
  const [imagenPreview, setImagenPreview] = useState(IMAGEN_DEFAULT);
  const [cargando, setCargando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [variantes, setVariantes] = useState([]);
  const [variantesInicializadas, setVariantesInicializadas] = useState(false);


  useEffect(() => {
    cargarDatosBase();
    if (esEdicion) {
      cargarProducto();
    }
  }, [id]);



  const cargarDatosBase = async () => {
    try {
      const [catRes, tallasRes, coloresRes] = await Promise.all([
        fetch("http://localhost:4000/categorias"),
        fetch("http://localhost:4000/tallas"),
        fetch("http://localhost:4000/colores")
      ]);

      const [catData, tallasData, coloresData] = await Promise.all([
        catRes.json(),
        tallasRes.json(),
        coloresRes.json()
      ]);

      setCategorias(catData);
      setTallas(tallasData);
      setColores(coloresData);
    } catch (error) {
      console.error("Error al cargar datos base:", error);
    }
  };

  const cargarProducto = async () => {
    try {
      console.log("🔵 [FRONTEND] Cargando producto con ID:", id);
      const res = await fetch(`http://localhost:4000/productos-admin/${id}`);
      const data = await res.json();

      console.log("🔵 [FRONTEND] Datos recibidos del producto:", {
        data,
        tallas: data.tallas,
        colores: data.colores,
        tallas_ids_mapped: data.tallas ? data.tallas.map(t => t.id_talla) : [],
        colores_ids_mapped: data.colores ? data.colores.map(c => c.id_color) : []
      });

      if (data) {
        const formDataNuevo = {
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          precio: data.precio || "",
          estado: data.estado || "Activo",
          categoria_id: data.categoria_id || "",
          tallas_ids: data.tallas ? data.tallas.map(t => t.id_talla) : [],
          colores_ids: data.colores ? data.colores.map(c => c.id_color) : [],
          imagen: data.imagen || ""
        };

        setFormData(formDataNuevo);

        if (data.imagen) {
          setImagenPreview(data.imagen);
        }

        // 👉 Evita duplicados
        if (data.colores) {
          setVariantes(
            data.colores.map(c => ({
              color_id: c.id_color,
              stock: c.stock || 0
            }))
          );


        }
      }


    } catch (error) {
      console.error("🔴 [FRONTEND] Error al cargar producto:", error);
      alert("Error al cargar el producto");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTallaToggle = (tallaId) => {
    console.log("🔵 [FRONTEND] Toggle talla:", tallaId);
    setFormData(prev => {
      const tallas = prev.tallas_ids || [];
      const nuevoEstado = tallas.includes(tallaId)
        ? tallas.filter(id => id !== tallaId)
        : [...tallas, tallaId];

      console.log("🔵 [FRONTEND] Nuevas tallas seleccionadas:", nuevoEstado);
      return {
        ...prev,
        tallas_ids: nuevoEstado
      };
    });
  };

  const handleColorToggle = (colorId) => {
    setFormData(prev => {
      const yaSeleccionado = prev.colores_ids.includes(colorId);

      if (yaSeleccionado) {
        // 🔻 Si se desmarca → quitar color y variante
        setVariantes(prevVar => prevVar.filter(v => v.color_id !== colorId));

        return {
          ...prev,
          colores_ids: prev.colores_ids.filter(id => id !== colorId)
        };
      } else {
        // 🔺 Si se marca → agregar color y crear variante en el acto
        setVariantes(prevVar => {
          // Para evitar duplicados
          if (!prevVar.some(v => v.color_id === colorId)) {
            return [...prevVar, { color_id: colorId, stock: 0 }];
          }
          return prevVar;
        });

        return {
          ...prev,
          colores_ids: [...prev.colores_ids, colorId]
        };
      }
    });
  };




  const handleImagenChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagenPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Subir a Cloudinary
    setSubiendoImagen(true);
    try {
      const formData = new FormData();
      formData.append("imagen", file);

      const res = await fetch("http://localhost:4000/subir-imagen", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({
          ...prev,
          imagen: data.url
        }));
      } else {
        alert("Error al subir la imagen");
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      alert("Error al subir la imagen");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      alert("El nombre es obligatorio");
      return false;
    }
    if (!formData.descripcion.trim()) {
      alert("La descripción es obligatoria");
      return false;
    }
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      alert("El precio debe ser mayor a 0");
      return false;
    }
    if (!formData.categoria_id) {
      alert("Debe seleccionar una categoría");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      const url = esEdicion
        ? `http://localhost:4000/productos-admin/${id}`
        : "http://localhost:4000/productos-admin";

      const method = esEdicion ? "PUT" : "POST";

      // Preparar arrays de tallas y colores
      const tallasIds = Array.isArray(formData.tallas_ids)
        ? formData.tallas_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
        : [];

      const coloresIds = Array.isArray(formData.colores_ids)
        ? formData.colores_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
        : [];

      const body = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: parseFloat(formData.precio),
        estado: formData.estado,
        categoria_id: parseInt(formData.categoria_id),
        tallas_ids: tallasIds,
        colores_ids: coloresIds,
        imagen: formData.imagen || null,
        variantes
      };

      // LOG FRONTEND: Datos que se envían
      console.log("🔵 [FRONTEND] Enviando datos:", {
        method,
        url,
        body,
        formDataOriginal: {
          tallas_ids: formData.tallas_ids,
          colores_ids: formData.colores_ids
        }
      });

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      // LOG FRONTEND: Respuesta del servidor
      console.log("🔵 [FRONTEND] Respuesta del servidor:", {
        status: res.status,
        ok: res.ok,
        data
      });

      if (data.success || res.ok) {
        alert(esEdicion ? "Producto actualizado correctamente" : "Producto creado correctamente");
        navigate("/productos-admin");
      } else {
        alert(data.message || "Error al guardar el producto");
      }
    } catch (error) {
      console.error("🔴 [FRONTEND] Error al guardar:", error);
      alert("Error al guardar el producto");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>
          {esEdicion ? "Editar Producto" : "Nuevo Producto"}
        </h1>
        <button onClick={() => navigate("/productos-admin")} style={styles.btnVolver}>
          ← Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          {/* Columna izquierda */}
          <div style={styles.columna}>
            <div style={styles.grupo}>
              <label style={styles.label}>
                NOMBRE <span style={styles.obligatorio}>*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.grupo}>
              <label style={styles.label}>
                DESCRIPCIÓN <span style={styles.obligatorio}>*</span>
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                style={styles.textarea}
                rows="4"
                required
              />
            </div>

            <div style={styles.grupo}>
              <label style={styles.label}>
                PRECIO <span style={styles.obligatorio}>*</span>
              </label>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                style={styles.input}
                step="0.01"
                min="0.01"
                required
              />
            </div>

            <div style={styles.grupo}>
              <label style={styles.label}>
                ESTADO <span style={styles.obligatorio}>*</span>
              </label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="estado"
                    value="Activo"
                    checked={formData.estado === "Activo"}
                    onChange={handleChange}
                  />
                  Activo
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="estado"
                    value="Inactivo"
                    checked={formData.estado === "Inactivo"}
                    onChange={handleChange}
                  />
                  Inactivo
                </label>
              </div>
            </div>

            <div style={styles.grupo}>
              <label style={styles.label}>
                CATEGORÍA <span style={styles.obligatorio}>*</span>
              </label>
              <select
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map(cat => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Columna derecha */}
          <div style={styles.columna}>
            <div style={styles.grupo}>
              <label style={styles.label}>TALLAS</label>
              <div style={styles.tallasContainer}>
                {tallas.map(t => (
                  <label
                    key={t.id_talla}
                    style={{
                      ...styles.tallaLabel,
                      ...(formData.tallas_ids.includes(t.id_talla) ? styles.tallaLabelSeleccionada : {})
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.tallas_ids.includes(t.id_talla)}
                      onChange={() => handleTallaToggle(t.id_talla)}
                      style={styles.checkbox}
                    />
                    {t.talla}
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.grupo}>
              <label style={styles.label}>COLORES</label>
              <div style={styles.coloresContainer}>
                {colores.map(c => {
                  const isSelected = formData.colores_ids.includes(c.id_color);
                  return (
                    <div
                      key={c.id_color}
                      style={styles.colorItem}
                      onClick={() => handleColorToggle(c.id_color)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.querySelector('div').style.transform = 'scale(1.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.querySelector('div').style.transform = 'scale(1)';
                      }}
                    >
                      <div
                        style={{
                          ...styles.colorCircle,
                          backgroundColor: c.codigo_hex || "#000000",
                          border: isSelected
                            ? "3px solid #000"
                            : "2px solid #ccc",
                          transform: isSelected ? "scale(1.1)" : "scale(1)"
                        }}
                        title={c.nombre}
                      />
                      <span style={styles.colorNombre}>{c.nombre}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {variantes.length > 0 && (
              <div style={styles.grupo}>
                <label style={styles.label}>STOCK POR COLOR</label>

                {variantes.map((v, index) => {
                  const colorInfo = colores.find(c => c.id_color === v.color_id);

                  return (
                    <div key={v.color_id} style={{ marginBottom: "10px" }}>
                      <strong>{colorInfo?.nombre}</strong>

                      <div style={{ marginBottom: "10px" }}>
                        <strong>{colorInfo?.nombre}</strong>
                        <div style={{ marginBottom: "10px" }}>
                          <strong>{colorInfo?.nombre}</strong>

                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => {
                              const nuevoStock = parseInt(e.target.value) || 0;

                              setVariantes(prev =>
                                prev.map(item =>
                                  item.color_id === v.color_id
                                    ? { ...item, stock: nuevoStock }
                                    : item
                                )
                              );
                            }}
                            style={{ marginLeft: "10px", width: "80px" }}
                          />
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}


            <div style={styles.grupo}>
              <label style={styles.label}>IMAGEN</label>
              <div style={styles.imagenContainer}>
                <img src={imagenPreview} alt="Preview" style={styles.imagenPreview} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  style={styles.fileInput}
                />
                {subiendoImagen && (
                  <div style={styles.subiendo}>Subiendo imagen...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.botones}>
          <button
            type="button"
            onClick={() => navigate("/productos-admin")}
            style={styles.btnCancelar}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando || subiendoImagen}
            style={styles.btnGuardar}
          >
            {cargando ? "Guardando..." : esEdicion ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px"
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
  form: {
    background: "#fff",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    marginBottom: "30px"
  },
  columna: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  grupo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333"
  },
  obligatorio: {
    color: "#dc3545"
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "14px"
  },
  textarea: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "14px",
    resize: "vertical"
  },
  select: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "14px",
    background: "#fff"
  },
  radioGroup: {
    display: "flex",
    gap: "20px"
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px"
  },
  tallasContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },
  tallaLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 15px",
    border: "2px solid #ccc",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    background: "#fff",
    transition: "all 0.2s"
  },
  tallaLabelSeleccionada: {
    borderColor: "#000",
    background: "#f0f0f0",
    fontWeight: "bold"
  },
  checkbox: {
    cursor: "pointer"
  },
  coloresContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px"
  },
  colorItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    cursor: "pointer"
  },
  colorCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
  },
  colorNombre: {
    fontSize: "12px",
    textAlign: "center",
    maxWidth: "60px"
  },
  imagenContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  imagenPreview: {
    width: "200px",
    height: "200px",
    objectFit: "cover",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  fileInput: {
    padding: "5px"
  },
  subiendo: {
    color: "#007bff",
    fontSize: "12px"
  },
  botones: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #eee"
  },
  btnCancelar: {
    background: "#6c757d",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px"
  },
  btnGuardar: {
    background: "#000",
    color: "#fff",
    padding: "10px 30px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold"
  }
};

export default ProductoForm;

