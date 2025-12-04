import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const IMAGEN_DEFAULT = "/imgs/ropazz.png";


const CATEGORIAS = ["Polos", "Pantalones", "Casacas", "Shorts"];

function Catalogo() {
    const [productos, setProductos] = useState([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Polos");

    useEffect(() => {
    fetch("http://localhost:4000/productos")
        .then(res => res.json())
        .then(data => {
            const conImagen = data.map(item => ({
                ...item,
                imagen: item.imagen ? item.imagen : IMAGEN_DEFAULT
            }));

            setProductos(conImagen);
        })
        .catch(err => console.error("Error al cargar productos:", err));
}, []);



    const filtrados = productos.filter(p =>
        p.categoria?.toLowerCase() === categoriaSeleccionada.toLowerCase()
    );
    const navigate = useNavigate();
    return (
        <div>

            <div style={styles.categoriasBar}>
                {CATEGORIAS.map(cat => (
                    <button
                        key={cat}
                        style={{
                            ...styles.catBtn,
                            ...(categoriaSeleccionada === cat ? styles.catBtnActivo : {})
                        }}
                        onClick={() => setCategoriaSeleccionada(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>


            <div style={styles.container}>
                {filtrados.length === 0 && (
                    <p style={{ textAlign: "center", width: "100%" }}>
                        No hay productos en esta categoría.
                    </p>
                )}

                {filtrados.map((p) => (
                    <div key={p.id_producto} style={styles.card}>
                        <img src={p.imagen} style={styles.img} alt="" />
                        <h3 style={styles.nombre}>{p.nombre}</h3>
                        <p style={styles.precio}>S/ {p.precio}</p>

                        <button onClick={() => navigate(`/ropainfo/${p.id_producto}`)}>

                            Agregar
                        </button>



                    </div>
                ))}
            </div>
        </div>
    );
}


const styles = {
    categoriasBar: {
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        padding: "15px 0",
        borderBottom: "1px solid #ccc",
        background: "#fafafa",
        marginBottom: "20px"
    },
    catBtn: {
        background: "transparent",
        border: "none",
        fontSize: "18px",
        cursor: "pointer",
        padding: "8px 15px",
        color: "#444"
    },
    catBtnActivo: {
        borderBottom: "3px solid black",
        fontWeight: "bold",
        color: "black"
    },
    container: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "20px",
        padding: "20px"
    },
    card: {
        background: "#fff",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        textAlign: "center",
        paddingBottom: "15px"
    },
    img: {
        width: "100%",
        height: "220px",
        objectFit: "cover"
    },
    nombre: {
        fontSize: "18px",
        margin: "10px 0"
    },
    precio: {
        fontSize: "17px",
        fontWeight: "bold",
        marginBottom: "10px"
    },
    btn: {
        background: "#000",
        color: "#fff",
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer"
    }
};

export default Catalogo;
