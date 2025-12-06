import "../styles/info.css";

function Info() {
  return (
    <div className="info-container">

      {/* Imagen izquierda */}
      <div className="info-left">
        <img
          src="/imgs/calle.png"
          alt="Urban Vibe"
          className="info-img"
        />
      </div>

      {/* Texto derecha */}
      <div className="info-right">
        <h1 className="info-title">Urban Vibe</h1>

        <p className="info-text">
          En <strong>Urban Vibe</strong>, creemos que la ropa es más que moda:
          es una forma de expresión personal. Desde nuestros inicios, buscamos
          combinar lo mejor del estilo urbano con comodidad, calidad y diseños
          que transmitan actitud.
        </p>

        <p className="info-text">
          Trabajamos con proveedores confiables y materiales seleccionados,
          garantizando prendas que no solo se ven bien, sino que también se
          sienten bien. Cada colección está inspirada en la cultura callejera,
          la creatividad y la libertad de estilo.
        </p>

        <h2 className="info-subtitle">¿Qué nos caracteriza?</h2>

        <ul className="info-list">
          <li>Prendas urbanas premium con identidad propia.</li>
          <li>Diseños modernos inspirados en tendencias globales.</li>
          <li>Actualizaciones constantes en nuestro catálogo.</li>
          <li>Envíos rápidos y precios accesibles.</li>
        </ul>

        <p className="info-footer">
          Urban Vibe — La vibra eres tú. Tu estilo, tu esencia.
        </p>
      </div>
    </div>
  );
}

export default Info;
