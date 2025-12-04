import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";

const IMAGEN_DEFAULT = "/imgs/ropazz.png";

function RopaInfo() {
    const { id } = useParams();


    const { addToCart } = useCart();

    const [producto, setProducto] = useState(null);
    const [tallas, setTallas] = useState([]);
    const [colores, setColores] = useState([]);
    const [cantidad, setCantidad] = useState(1);
    const [tallaSel, setTallaSel] = useState(null);
    const [colorSel, setColorSel] = useState(null);
    const [stock, setStock] = useState(null);
    const [stockError, setStockError] = useState(false);

    const colorMap = {
        negro: "black",
        blanco: "white",
        azul: "blue",
        beige: "#f5f5dc",
        verde: "green",
        rojo: "red"
    };


    useEffect(() => {
        fetch(`http://localhost:4000/producto/${id}`)
            .then(res => res.json())
            .then(data => {
                setProducto({
                    ...data,
                    imagen: data.imagen && data.imagen.trim() !== "" ? data.imagen : "/imgs/ropazz.png"
                });
            })
            .catch(err => console.error("Error al cargar producto:", err));


        fetch(`http://localhost:4000/producto/${id}/tallas`)
            .then(res => res.json())
            .then(data => setTallas(data));

        fetch(`http://localhost:4000/producto/${id}/colores`)
            .then(res => res.json())
            .then(data => setColores(data));
    }, [id]);


    useEffect(() => {
        if (!tallaSel || !colorSel) {
            setStock(null);
            return;
        }

        fetch(
            `http://localhost:4000/producto/${id}/stock-especifico?talla=${tallaSel}&color=${colorSel}`
        )
            .then(res => res.json())
            .then(data => {
                if (data && data.stock_actual !== undefined) {
                    setStock(data.stock_actual);
                    setStockError(false);
                } else {
                    setStock(0);
                    setStockError(true);
                }
                setCantidad(1);
            });
    }, [tallaSel, colorSel, id]);

    if (!producto) return <h2 style={{ textAlign: "center" }}>Cargando...</h2>;

    return (
        <div style={styles.container}>
            <img
                src={producto.imagen && producto.imagen.trim() !== "" ? producto.imagen : IMAGEN_DEFAULT}
                style={styles.img}
                alt={producto.nombre}
            />



            <div style={styles.info}>
                <h2>{producto.nombre}</h2>
                <p style={styles.precio}>S/ {producto.precio}</p>
                <p>{producto.descripcion}</p>


                {stock === null && (
                    <p style={{ color: "gray" }}>
                        Selecciona talla y color para ver stock
                    </p>
                )}

                {stock !== null && !stockError && (
                    <p><b>Stock disponible:</b> {stock}</p>
                )}

                {stockError && (
                    <p style={{ color: "red" }}>
                        No hay stock para esta combinación
                    </p>
                )}


                <h4>Colores:</h4>
                <div style={styles.flex}>
                    {colores.map(c => (
                        <div
                            key={c.id_color}
                            onClick={() => setColorSel(c.id_color)}
                            style={{
                                ...styles.colorCircle,
                                background: colorMap[c.nombre.toLowerCase()] || "#ccc",
                                border:
                                    colorSel === c.id_color
                                        ? "3px solid black"
                                        : "1px solid #ccc"
                            }}
                        ></div>
                    ))}
                </div>


                <h4>Tallas:</h4>
                <div style={styles.flex}>
                    {tallas.map(t => (
                        <button
                            key={t.id_talla}
                            onClick={() => setTallaSel(t.id_talla)}
                            style={{
                                ...styles.tallaBtn,
                                background:
                                    tallaSel === t.id_talla ? "black" : "#e6e6e6",
                                color:
                                    tallaSel === t.id_talla ? "white" : "black"
                            }}
                        >
                            {t.talla}
                        </button>
                    ))}
                </div>


                {tallaSel && colorSel && (
                    <div style={styles.cantidadBox}>
                        <button
                            onClick={() =>
                                setCantidad(cantidad > 1 ? cantidad - 1 : 1)
                            }
                        >
                            -
                        </button>

                        <span>{cantidad}</span>

                        <button
                            onClick={() => {
                                if (stock && cantidad < stock) {
                                    setCantidad(cantidad + 1);
                                }
                            }}
                            disabled={!stock || cantidad >= stock}
                        >
                            +
                        </button>
                    </div>
                )}

                <button
                    style={styles.btnAgregar}
                    onClick={() => {
                        if (!tallaSel || !colorSel) {
                            alert("Debes seleccionar talla y color");
                            return;
                        }

                        addToCart({
                            id_producto: producto.id_producto,
                            nombre: producto.nombre,
                            precio: producto.precio,

                            imagen:
                                producto.imagen && producto.imagen.trim() !== ""
                                    ? producto.imagen
                                    : "/imgs/ropazz.png",

                            id_talla: tallaSel,
                            talla: tallas.find(t => t.id_talla === tallaSel)?.talla,

                            id_color: colorSel,
                            color: colores.find(c => c.id_color === colorSel)?.nombre,

                            cantidad,
                        });





                        alert("Producto añadido al carrito");
                    }}
                >
                    AÑADIR AL CARRITO
                </button>

            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        padding: "40px",
        gap: "40px"
    },
    img: {
        width: "100%",
        borderRadius: "15px"
    },
    info: {
        paddingTop: "20px"
    },
    precio: {
        fontSize: "25px",
        fontWeight: "bold"
    },
    flex: {
        display: "flex",
        gap: "10px",
        marginBottom: "15px"
    },
    colorCircle: {
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        cursor: "pointer"
    },
    tallaBtn: {
        padding: "8px 15px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold"
    },
    cantidadBox: {
        display: "flex",
        gap: "20px",
        alignItems: "center",
        margin: "20px 0"
    },
    btnAgregar: {
        padding: "12px 30px",
        background: "black",
        color: "white",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "16px"
    }
};

export default RopaInfo;
