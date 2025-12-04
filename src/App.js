import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Inicio from "./paginas/inicio.js";
import Catalogo from "./paginas/catalogo.js";
import RopaInfo from "./paginas/ropainfo.js";
import Carrito from "./paginas/carrito.js";
import Footer from "./componentes/footer.js";
import { CartProvider } from "./context/CartContext";
import PagoFinal from "./paginas/pagofinal.js";
import PagoFinal2 from "./paginas/pagofinal2.js"; 
import Login from "./paginas/login.js";
import ProductosAdmin from "./paginas/productos-admin.js";
import ProductoForm from "./paginas/producto-form.js";
import Dashboard from "./paginas/dashboard.js";
import DetalleVenta from "./paginas/detalle-venta.js";
import Verificacion from "./paginas/verificacion.js";

function AppContent() {
  const location = useLocation();


  const rutasSinFooter = ["/login"];


  const ocultarFooter = rutasSinFooter.includes(location.pathname);

  return (
    <>
     
      {!ocultarFooter && <Footer />}

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/ropainfo/:id" element={<RopaInfo />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/checkout" element={<PagoFinal />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pagofinal2" element={<PagoFinal2 />} />
        <Route path="/productos-admin" element={<ProductosAdmin />} />
        <Route path="/productos-admin/nuevo" element={<ProductoForm />} />
        <Route path="/productos-admin/editar/:id" element={<ProductoForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/venta/:id" element={<DetalleVenta />} />
        <Route path="/verificacion" element={<Verificacion />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
