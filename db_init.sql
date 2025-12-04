-- Tabla Categorias
CREATE TABLE Categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(300)
);

-- Tabla Productos
CREATE TABLE Productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion VARCHAR(500),
    precio NUMERIC(10,2) NOT NULL,
    estado VARCHAR(50),
    categoria_id INT NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES Categorias(id_categoria)
);

-- Tabla Tallas
CREATE TABLE Tallas (
    id_talla SERIAL PRIMARY KEY,
    talla VARCHAR(10) NOT NULL
);

-- Tabla Colores
CREATE TABLE Colores (
    id_color SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    codigo_hex VARCHAR(7) NOT NULL DEFAULT '#000000'
);

-- Tabla Producto_Tallas
CREATE TABLE Producto_Tallas (
    id_producto INT NOT NULL,
    id_talla INT NOT NULL,
    PRIMARY KEY (id_producto, id_talla),
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto),
    FOREIGN KEY (id_talla) REFERENCES Tallas(id_talla)
);

-- Tabla Producto_Colores
CREATE TABLE Producto_Colores (
    id_producto INT NOT NULL,
    id_color INT NOT NULL,
    PRIMARY KEY (id_producto, id_color),
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto),
    FOREIGN KEY (id_color) REFERENCES Colores(id_color)
);

-- Tabla Inventario
CREATE TABLE Inventario (
    id_inventario SERIAL PRIMARY KEY,
    producto_id INT NOT NULL,
    id_talla INT NOT NULL,
    id_color INT NOT NULL,
    stock_actual INT NOT NULL,
    ubicacion VARCHAR(100),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (producto_id) REFERENCES Productos(id_producto),
    FOREIGN KEY (id_talla) REFERENCES Tallas(id_talla),
    FOREIGN KEY (id_color) REFERENCES Colores(id_color)
);

-- Tabla Pedidos
CREATE TABLE Pedidos (
    id_pedido SERIAL PRIMARY KEY,
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(255) NOT NULL,
    direccion VARCHAR(500) NOT NULL,
    telefono VARCHAR(20),
    fecha_pedido TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(50),
    total NUMERIC(10,2)
);

-- Tabla Detalle_Pedido
CREATE TABLE Detalle_Pedido (
    id_detalle SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    id_talla INT NOT NULL,
    id_color INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) GENERATED ALWAYS AS (precio_unitario * cantidad) STORED,
    FOREIGN KEY (pedido_id) REFERENCES Pedidos(id_pedido),
    FOREIGN KEY (producto_id) REFERENCES Productos(id_producto),
    FOREIGN KEY (id_talla) REFERENCES Tallas(id_talla),
    FOREIGN KEY (id_color) REFERENCES Colores(id_color)
);

-- Tabla Pagos
CREATE TABLE Pagos (
    id_pago SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (pedido_id) REFERENCES Pedidos(id_pedido)
);

-- Tabla MetodoPago
CREATE TABLE MetodoPago (
    metodo_pago VARCHAR(50) PRIMARY KEY,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabla Validaciones
CREATE TABLE Validaciones (
    process_type VARCHAR(50) PRIMARY KEY,
    val_stock BOOLEAN NOT NULL DEFAULT TRUE,
    val_price BOOLEAN NOT NULL DEFAULT TRUE,
    val_status BOOLEAN NOT NULL DEFAULT TRUE,
    msg_error VARCHAR(500)
);

-- Categorías
INSERT INTO Categorias (nombre, descripcion) VALUES
('Pantalones', 'Pantalones urbanos, cargo, skinny y jogger'),
('Casacas', 'Casacas urbanas y streetwear'),
('Shorts', 'Shorts deportivos y urbanos'),
('Polos', 'Polos oversize y streetwear');

-- Tallas
INSERT INTO Tallas (talla) VALUES
('S'), ('M'), ('L'), ('XL');

-- Colores
INSERT INTO Colores (nombre, codigo_hex) VALUES
('Negro', '#000000'), 
('Blanco', '#FFFFFF'), 
('Azul', '#0000FF'), 
('Beige', '#F5F5DC'), 
('Verde', '#008000'), 
('Rojo', '#FF0000');

-- Productos
INSERT INTO Productos (nombre, descripcion, precio, estado, categoria_id) VALUES
('Jean Cargo Negro', 'Cargo urbano negro oversize', 99.00, 'Activo', 1),
('Jogger Denim Azul', 'Jogger denim azul', 89.00, 'Activo', 1),
('Casaca Rompeviento Negra', 'Rompeviento urbano impermeable', 120.00, 'Activo', 2),
('Casaca Oversize Beige', 'Casaca oversize estilo urbano', 140.00, 'Activo', 2),
('Short Cargo Verde', 'Short cargo urbano verde', 69.00, 'Activo', 3),
('Short Deportivo Negro', 'Short deportivo casual', 59.00, 'Activo', 3),
('Polo Oversize Blanco', 'Polo blanco oversize unisex', 49.00, 'Activo', 4),
('Polo Street Azul', 'Polo urbano azul estilo streetwear', 55.00, 'Activo', 4);

-- Producto_Tallas
INSERT INTO Producto_Tallas (id_producto, id_talla) VALUES
(1,1),(1,2),(1,3),
(2,1),(2,2),(2,3),
(3,1),(3,2),(3,3),
(4,1),(4,2),(4,3),
(5,1),(5,2),(5,3),
(6,1),(6,2),(6,3),
(7,1),(7,2),(7,3),
(8,1),(8,2),(8,3);

-- Producto_Colores
INSERT INTO Producto_Colores (id_producto, id_color) VALUES
(1,1),(2,3),(3,1),(4,4),(5,5),(6,1),(7,2),(8,3);

-- Inventario
INSERT INTO Inventario (producto_id, id_talla, id_color, stock_actual, ubicacion) VALUES
(1,2,1,50,'Almacén A'),
(2,3,3,30,'Almacén B'),
(3,2,1,40,'Almacén A'),
(4,3,4,20,'Almacén C'),
(5,2,5,35,'Almacén B'),
(6,1,1,60,'Almacén D'),
(7,3,2,25,'Almacén A'),
(8,2,3,45,'Almacén C');

-- Pedidos
INSERT INTO Pedidos (cliente_nombre, cliente_email, direccion, telefono, estado, total) VALUES
('Carlos Ramos', 'carlos@gmail.com', 'Chorrillos', '987654321', 'Pagado', 99.00),
('Lucía Vargas', 'lucia@gmail.com', 'Surco', '912345678', 'Pendiente', 140.00),
('Pedro Medina', 'pedro@gmail.com', 'Miraflores', '955112233', 'Procesando', 69.00);

-- Detalle_Pedido
INSERT INTO Detalle_Pedido (pedido_id, producto_id, id_talla, id_color, cantidad, precio_unitario) VALUES
(1, 1, 2, 1, 1, 99.00),
(2, 4, 3, 4, 1, 140.00),
(3, 5, 2, 5, 1, 69.00);

-- Pagos
INSERT INTO Pagos (pedido_id, metodo_pago, monto) VALUES
(1, 'Tarjeta', 99.00),
(2, 'Yape', 140.00),
(3, 'Efectivo', 69.00);

-- MetodoPago
INSERT INTO MetodoPago (metodo_pago) VALUES
('Tarjeta'), ('Yape'), ('Efectivo'), ('Plin');

-- Validaciones
INSERT INTO Validaciones (process_type, val_stock, val_price, val_status, msg_error) VALUES
('carrito', TRUE, TRUE, TRUE, 'Todo correcto'),
('checkout', TRUE, TRUE, TRUE, 'Validación OK');

ALTER TABLE Productos
ADD COLUMN imagen VARCHAR(255);

-- Tabla Historial_Productos para registrar cambios
CREATE TABLE Historial_Productos (
    id_historial SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    usuario VARCHAR(100),
    fecha_cambio TIMESTAMP DEFAULT NOW(),
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
);

-- Tabla Parametrizaciones
CREATE TABLE Parametrizaciones (
    id_parametro SERIAL PRIMARY KEY,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    descripcion VARCHAR(500),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Tabla Promociones
CREATE TABLE Promociones (
    id_promocion SERIAL PRIMARY KEY,
    categoria_id INT NOT NULL,
    porcentaje_descuento NUMERIC(5,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (categoria_id) REFERENCES Categorias(id_categoria)
);

-- Insertar parametrizaciones iniciales
INSERT INTO Parametrizaciones (codigo, nombre, valor, descripcion) VALUES
('TASA_CRECIMIENTO_MENSUAL', 'Tasa de Crecimiento Mensual (%)', 10.00, 'Tasa mínima de crecimiento mensual esperada'),
('MINIMO_VENTAS_MENSUAL', 'Mínimo de Ventas Mensual', 5000.00, 'Monto mínimo de ventas mensuales esperado');