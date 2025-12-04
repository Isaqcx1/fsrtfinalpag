import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

function Carrito() {
  const { cart, removeFromCart } = useCart();

  if (cart.length === 0)
    return <h2 style={{ textAlign: "center" }}>Carrito vacío</h2>;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  );



  const total = subtotal;

  const colorMap = {
    negro: "black",
    blanco: "white",
    azul: "blue",
    beige: "#f5f5dc",
    verde: "green",
    rojo: "red",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px", padding: "40px" }}>


      <div>
        <h2>Carrito de Compras ({cart.length} productos)</h2>

        {cart.map((item, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: 15,
              marginBottom: 20,
              borderRadius: 10,
              display: "flex",
              gap: 20,
            }}
          >

            <div>
              <img
                src={
                  item.imagen && item.imagen.trim() !== ""
                    ? item.imagen
                    : "/imgs/ropazz.png"
                }
                alt={item.nombre}
                style={{ width: 120, borderRadius: 10 }}
              />


            </div>


            <div style={{ flex: 1 }}>
              <h3>{item.nombre}</h3>

              <p><b>Talla:</b> {item.talla}</p>

              <p style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <b>Color:</b> {item.color}
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "inline-block",
                    background: colorMap[item.color.toLowerCase()] || "#222",
                    border: "1px solid #000"
                  }}
                ></span>
              </p>

              <p><b>Cantidad:</b> {item.cantidad}</p>
              <p><b>Precio unitario:</b> S/ {item.precio}</p>
              <p><b>Subtotal:</b> S/ {item.precio * item.cantidad}</p>

              <button onClick={() => removeFromCart(index)}>Quitar</button>
            </div>
          </div>
        ))}
      </div>


      <div style={{ border: "1px solid #ccc", padding: 20, borderRadius: 10 }}>
        <h3>Resumen de la Orden</h3>

        <div style={{ marginTop: 15 }}>
          <p>
            <b>Productos ({cart.length})</b>
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10
            }}
          >
            <span>SubTotal</span>
            <span>S/ {subtotal}</span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              color: "red",
            }}
          >


          </div>

          <hr style={{ margin: "15px 0" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            <span>Total:</span>
            <span>S/ {total}</span>
          </div>
        </div>

        <Link to="/checkout">
          <button style={{ width: "100%", padding: 12, marginTop: 20 }}>
            Continuar Compra
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Carrito;
