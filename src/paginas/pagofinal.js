// pagofinal.js
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";


function PagoFinal() {
    const { cart } = useCart();
    const navigate = useNavigate();



    const [form, setForm] = useState({
        email: "",
        nombres: "",
        apellidos: "",
        telefono: "",
        direccion: "",
        departamento: "",
        distrito: "",
        dni: ""
    });

    const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);


    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };


    const handleSubmit = async () => {
        if (!form.email || !form.nombres || !form.apellidos || !form.telefono || !form.direccion) {
            alert("Completa todos los campos obligatorios");
            return;
        }

        try {
            console.log("Enviando pedido...", {
                cliente_nombre: `${form.nombres} ${form.apellidos}`,
                cliente_email: form.email,
                direccion: `${form.departamento}, ${form.distrito}, ${form.direccion}`,
                telefono: form.telefono,
                estado: "Pendiente",
                total: total
            });

            const res = await fetch("http://localhost:4000/pedidos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cliente_nombre: `${form.nombres} ${form.apellidos}`,
                    cliente_email: form.email,
                    direccion: `${form.departamento}, ${form.distrito}, ${form.direccion}`,
                    telefono: form.telefono,
                    estado: "Pendiente",
                    total: total
                })
            });

            const data = await res.json();
            console.log("Respuesta del backend:", data);

            if (data.success) {
                navigate("/pagofinal2", {
                    state: {
                        pedidoId: data.pedido_id,
                        total: total,
                        items: cart
                    }
                });

            } else {
                alert("El backend respondió pero sin éxito");
            }

        } catch (err) {
            console.error("ERROR FETCH:", err);
            alert("Error al registrar el pedido (fetch falló)");
        }
    };



    return (
        <div style={{ display: "flex", padding: "40px", gap: "40px" }}>


            <div style={{ flex: 2 }}>
                <h2>Información</h2>

                <label>Dirección de correo electrónico</label>
                <input
                    type="email"
                    name="email"
                    onChange={handleChange}
                    value={form.email}
                    style={{ width: "100%", padding: 10, marginBottom: 20 }}
                />

                <h2>Detalles de facturación</h2>

                <div style={{ display: "flex", gap: "20px" }}>
                    <div style={{ flex: 1 }}>
                        <label>DNI / CE / RUC</label>
                        <input
                            type="text"
                            name="dni"
                            onChange={handleChange}
                            value={form.dni}
                            style={{ width: "100%", padding: 10, marginBottom: 20 }}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <label>Nombres</label>
                        <input
                            type="text"
                            name="nombres"
                            onChange={handleChange}
                            value={form.nombres}
                            style={{ width: "100%", padding: 10, marginBottom: 20 }}
                        />
                    </div>
                </div>

                <label>Apellidos</label>
                <input
                    type="text"
                    name="apellidos"
                    onChange={handleChange}
                    value={form.apellidos}
                    style={{ width: "100%", padding: 10, marginBottom: 20 }}
                />

                <label>Teléfono</label>
                <input
                    type="text"
                    name="telefono"
                    onChange={handleChange}
                    value={form.telefono}
                    style={{ width: "100%", padding: 10, marginBottom: 20 }}
                />

                <div style={{ display: "flex", gap: "20px" }}>
                    <div style={{ flex: 1 }}>
                        <label>Departamento</label>
                        <input
                            type="text"
                            name="departamento"
                            onChange={handleChange}
                            value={form.departamento}
                            style={{ width: "100%", padding: 10, marginBottom: 20 }}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <label>Distrito</label>
                        <input
                            type="text"
                            name="distrito"
                            onChange={handleChange}
                            value={form.distrito}
                            style={{ width: "100%", padding: 10, marginBottom: 20 }}
                        />
                    </div>
                </div>

                <label>Dirección Completa</label>
                <input
                    type="text"
                    name="direccion"
                    onChange={handleChange}
                    value={form.direccion}
                    style={{ width: "100%", padding: 10, marginBottom: 20 }}
                />


                <button
                    onClick={handleSubmit}
                    style={{ padding: "12px 20px", fontSize: 16, marginTop: 20 }}
                >
                    Continuar a Métodos de Pago
                </button>


            </div>


            <div style={{
                flex: 1,
                borderLeft: "1px solid #ccc",
                paddingLeft: "20px"
            }}>
                <h3>TU PEDIDO</h3>

                {cart.map((item, index) => (
                    <div key={index} style={{ display: "flex", marginBottom: 20, alignItems: "center" }}>
                        <img
                            src={
                                item.imagen && item.imagen.trim() !== ""
                                    ? item.imagen
                                    : "/imgs/ropazz.png"
                            }
                            alt={item.nombre}
                            width={80}
                            style={{ borderRadius: 5, marginRight: 10 }}
                        />

                        <div>
                            <p><b>{item.nombre}</b></p>
                            <p>S/ {item.precio}</p>
                        </div>
                    </div>
                ))}

                <hr />

                <h3>Total: S/ {total}</h3>
            </div>
        </div>
    );
}

export default PagoFinal;
