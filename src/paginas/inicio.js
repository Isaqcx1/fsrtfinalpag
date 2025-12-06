import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const CATEGORIAS = [
  { nombre: "Polos", img: "/imgs/polos.png" },
  { nombre: "Pantalones", img: "/imgs/pantalones.png" },
  { nombre: "Casacas", img: "/imgs/casacas.png" },
  { nombre: "Shorts", img: "/imgs/shorts.png" }
];

function Inicio() {
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:4000/productos")
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error("Error:", err));
  }, []);

    
    const ejemploCategorias = CATEGORIAS.map(cat =>
      productos.find(
        p => p.categoria?.toLowerCase() === cat.nombre.toLowerCase()
      )
    ).filter(Boolean);





    return (
      <div>
        
        <div style={styles.hero}></div>

        
        <div style={styles.categoriasContainer}>
          {CATEGORIAS.map(cat => (
            <div
              key={cat.nombre}
              style={styles.categoriaCard}
              onClick={() =>
                navigate(`/catalogo?cat=${encodeURIComponent(cat.nombre)}`)
              }
            >
              <img src={cat.img} alt={cat.nombre} style={styles.categoriaImg} />
              <p style={styles.categoriaTexto}>{cat.nombre}</p>
            </div>
          ))}
        </div>


        
        <h2 style={styles.titulo}>Explora nuestras prendas</h2>

        <div style={styles.productosContainer}>
          {ejemploCategorias.map(p => (
            <div key={p.id_producto} style={styles.card}>
              <img src={p.imagen} style={styles.img} alt="" />
              <h3 style={styles.nombre}>{p.nombre}</h3>
              <p style={styles.precio}>S/ {p.precio}</p>

              <button
                style={styles.btn}
                onClick={() => navigate(`/ropainfo/${p.id_producto}`)}
              >
                Ver más
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const styles = {
    categoriasContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "100px",
      padding: "25px 20px",
      flexWrap: "wrap",
      background: "#000"
    },
    categoriaCard: {
      width: "600px",
      cursor: "pointer",
      textAlign: "center",
      borderRadius: "15px",
      overflow: "hidden",
      background: "#111",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
    },
    categoriaImg: {
      width: "100%",
      height: "300px",
      objectFit: "cover"
    },
    categoriaTexto: {
      color: "white",
      padding: "10px 0",
      fontWeight: "bold",
      fontSize: "16px"
    },
    hero: {
      width: "100%",
      height: "80vh",
      backgroundImage: "url('/imgs/inicio.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      marginTop: "0px"
    },
    titulo: {
      textAlign: "center",
      marginTop: "25px",
      fontSize: "26px",
      fontWeight: "bold"
    },
    productosContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "25px",
      flexWrap: "wrap",
      padding: "20px"
    },
    card: {
      width: "300px",
      padding: "40px",
      borderRadius: "12px",
      background: "#fff",
      textAlign: "center",
      boxShadow: "0 3px 10px rgba(0,0,0,0.2)"
    },
    img: {
      width: "100%",
      height: "300px",
      objectFit: "cover",
      borderRadius: "10px"
    },
    nombre: {
      margin: "10px 0 0 0"
    },
    precio: {
      margin: "5px 0",
      fontWeight: "bold"
    },
    btn: {
      marginTop: "10px",
      background: "black",
      color: "white",
      padding: "8px 12px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer"
    }
  };

  export default Inicio;
