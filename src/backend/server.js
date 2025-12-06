const express = require("express");
const cors = require("cors");
const pool = require("./db");
const { validarConexion } = require("./db");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());

// ========== FUNCIONES HELPER PARA MANEJO DE FECHAS EN UTC-5 (LIMA) ==========

// Función para obtener la fecha/hora actual en Lima (UTC-5) y convertirla a UTC para almacenar
// Supabase almacena en UTC, así que obtenemos la hora UTC actual
// Cuando leamos de la BD, convertiremos de UTC a Lima usando AT TIME ZONE 'America/Lima'
const getLimaNowUTC = () => {
  // Obtener fecha/hora exacta en Lima SIN manipular manualmente UTC
  const nowInLima = new Date().toLocaleString("en-CA", {
    timeZone: "America/Lima",
    hour12: false
  });

  // "2025-12-05 14:30:45" → convertir a formato ISO compatible
  const [datePart, timePart] = nowInLima.split(", ");
  return `${datePart}T${timePart}`;
};


// Función para obtener la fecha actual (solo fecha, sin hora) en Lima y convertirla a UTC
// Retorna el inicio del día actual en UTC (00:00:00 UTC)
const getLimaTodayUTC = () => {
  const ahora = new Date();

  // Obtener la fecha actual en UTC
  const year = ahora.getUTCFullYear();
  const month = ahora.getUTCMonth();
  const day = ahora.getUTCDate();

  // Crear fecha que represente el inicio del día actual en UTC (00:00:00 UTC)
  const fechaUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

  return fechaUTC.toISOString();
};

// Función helper para convertir fecha a zona horaria de Lima (UTC-5)
const toLimaTime = (date) => {
  if (!date) return null;

  // Si es string, convertir a Date
  const d = date instanceof Date ? date : new Date(date);

  // Obtener la fecha en formato ISO
  const isoString = d.toISOString();

  // Retornar la fecha con timezone de Lima
  // PostgreSQL manejará la conversión si usamos AT TIME ZONE
  return isoString;
};

// Función para formatear fecha para INSERT/UPDATE en zona horaria de Lima
const formatDateForLima = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  // Convertir a string ISO que PostgreSQL puede interpretar
  return d.toISOString();
};

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: "dwnbx1pdw",
  api_key: "529189883251453",
  api_secret: "cGoF2V9bDgAvzViqb4Ubw7-bic0",
});

// Configuración de Multer (almacenamiento en memoria para Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoint para verificar la conexión con la base de datos
app.get("/db/health", async (req, res) => {
  try {
    const serverTime = getLimaNowUTC();
    const result = await pool.query("SELECT version() as db_version");
    res.json({
      status: "connected",
      server_time: serverTime,
      db_version: result.rows[0].db_version.split(" ")[0] + " " + result.rows[0].db_version.split(" ")[1]
    });
  } catch (error) {
    res.status(500).json({
      status: "disconnected",
      error: error.message
    });
  }
});



app.get("/productos", async (req, res) => {
  try {
    const estado = req.query.estado || "Activo";

    let query = `
      SELECT p.*, c.nombre AS categoria
      FROM Productos p
      JOIN Categorias c ON p.categoria_id = c.id_categoria
    `;

    if (estado !== "Todos") {
      query += ` WHERE p.estado = $1`;
    }

    const params = estado !== "Todos" ? [estado] : [];

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

app.get("/producto/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT p.*, c.nombre AS categoria
      FROM Productos p
      JOIN Categorias c ON p.categoria_id = c.id_categoria
      WHERE p.id_producto = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en GET /producto/:id", error);
    res.status(500).json({ message: "Error al obtener producto" });
  }
});


app.get("/producto/:id/tallas", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT t.*
      FROM Producto_Tallas pt
      JOIN Tallas t ON pt.id_talla = t.id_talla
      WHERE pt.id_producto = $1
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener tallas" });
  }
});

app.get("/producto/:id/colores", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT c.*
      FROM Producto_Colores pc
      JOIN Colores c ON pc.id_color = c.id_color
      WHERE pc.id_producto = $1
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener colores" });
  }
});



app.put("/producto/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { color_id, talla_id, stock } = req.body;

    if (!color_id || !talla_id || stock === undefined) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    // 1️⃣ Verificar si existe el registro en inventario
    const existe = await pool.query(
      `
      SELECT * FROM Inventario
      WHERE producto_id = $1 AND id_color = $2 AND id_talla = $3
      `,
      [id, color_id, talla_id]
    );

    if (existe.rows.length > 0) {
      // 2️⃣ Si existe → UPDATE
      await pool.query(
        `
        UPDATE Inventario
        SET stock_actual = $1, fecha_actualizacion = NOW()
        WHERE producto_id = $2 AND id_color = $3 AND id_talla = $4
        `,
        [stock, id, color_id, talla_id]
      );

      return res.json({
        success: true,
        message: "Stock actualizado correctamente (UPDATE)"
      });
    }

    // 3️⃣ Si NO existe → INSERT
    await pool.query(
      `
      INSERT INTO Inventario (producto_id, id_color, id_talla, stock_actual, fecha_actualizacion)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      [id, color_id, talla_id, stock]
    );

    return res.json({
      success: true,
      message: "Stock creado correctamente (INSERT)"
    });

  } catch (error) {
    console.error("❌ Error al actualizar stock:", error);
    res.status(500).json({ message: "Error al actualizar stock" });
  }
});





app.get("/producto/:id/stock-especifico", async (req, res) => {
  try {
    const { id } = req.params;
    const { talla, color } = req.query;

    console.log("🔎 Buscando stock de:", { id, talla, color });

    const result = await pool.query(`
      SELECT *
      FROM Inventario
      WHERE producto_id = $1 AND id_talla = $2 AND id_color = $3
    `, [id, talla, color]);

    console.log("➡️ Resultado SQL:", result.rows);

    res.json(result.rows[0] || { stock_actual: 0 });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener stock específico" });
  }
});




app.post("/pedidos", async (req, res) => {
  try {
    const { cliente_nombre, cliente_email, direccion, telefono, total } = req.body;
    const fechaPedido = getLimaNowUTC();

    const result = await pool.query(
      `INSERT INTO Pedidos (cliente_nombre, cliente_email, direccion, telefono, estado, total, fecha_pedido)
       VALUES ($1, $2, $3, $4, 'Pendiente', $5, $6)
       RETURNING id_pedido`,
      [cliente_nombre, cliente_email, direccion, telefono, total, fechaPedido]
    );

    res.json({
      success: true,
      pedido_id: result.rows[0].id_pedido
    });

  } catch (error) {
    console.error("❌ ERROR EN /pedidos:", error);
    res.status(500).json({ success: false, message: "Error al registrar pedido" });
  }
});


app.post("/pedido-completar", async (req, res) => {
  const client = await pool.connect();

  try {
    const { pedido_id, items, metodo_pago, total } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "El campo 'items' debe ser un arreglo."
      });
    }

    await client.query("BEGIN");

    for (const item of items) {
      const productoId = item.id_producto || item.id;
      const tallaNombre = item.talla;
      const colorNombre = item.color;
      const cantidad = item.cantidad;
      const precio = item.precio;

      if (!productoId || !tallaNombre || !colorNombre || !cantidad || !precio) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos en un item",
          item
        });
      }


      const tallaRes = await client.query(
        `SELECT id_talla FROM Tallas WHERE talla = $1`,
        [tallaNombre]
      );

      if (tallaRes.rows.length === 0)
        throw new Error(`No existe la talla '${tallaNombre}'`);

      const tallaId = tallaRes.rows[0].id_talla;


      const colorRes = await client.query(
        `SELECT id_color FROM Colores WHERE nombre = $1`,
        [colorNombre]
      );

      if (colorRes.rows.length === 0)
        throw new Error(`No existe el color '${colorNombre}'`);

      const colorId = colorRes.rows[0].id_color;


      await client.query(
        `INSERT INTO Detalle_Pedido 
             (pedido_id, producto_id, id_talla, id_color, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          pedido_id,
          productoId,
          tallaId,
          colorId,
          cantidad,
          precio
        ]
      );


      

      const fechaActualizacion = getLimaNowUTC();
      await client.query(
        `UPDATE Inventario 
         SET stock_actual = stock_actual - $1, fecha_actualizacion = $5
         WHERE producto_id = $2 AND id_talla = $3 AND id_color = $4`,
        [cantidad, productoId, tallaId, colorId, fechaActualizacion]
      );
    }

    const fechaPago = getLimaNowUTC();
    await client.query(
      `INSERT INTO Pagos (pedido_id, metodo_pago, monto, fecha_pago)
       VALUES ($1, $2, $3, $4)`,
      [pedido_id, metodo_pago, total, fechaPago]
    );

    // Actualizar estado del pedido a "Pagado"
    await client.query(
      `UPDATE Pedidos SET estado = 'Pagado' WHERE id_pedido = $1`,
      [pedido_id]
    );


    await client.query("COMMIT");

    res.json({ success: true });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ ERROR pedido-completar:", error);
    res.status(500).json({ success: false, message: "Error al completar pedido" });
  } finally {
    client.release();
  }
});



// Endpoint para subir imagen a Cloudinary
app.post("/subir-imagen", upload.single("imagen"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ninguna imagen" });
    }

    // Subir a Cloudinary usando el buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "productos",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error subiendo imagen" });
  }
});

// Obtener todas las categorías
app.get("/categorias", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Categorias ORDER BY nombre");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener categorías" });
  }
});

// Obtener todas las tallas
app.get("/tallas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Tallas ORDER BY id_talla");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener tallas" });
  }
});

// Obtener todos los colores
app.get("/colores", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Colores ORDER BY nombre");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener colores" });
  }
});

// Listar productos con paginación y filtros (para administración)
app.get("/productos-admin", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const categoriaId = req.query.categoria_id;

    let query = `
      SELECT 
        p.id_producto,
        p.nombre,
        p.precio,
        p.estado,
        p.imagen,
        c.nombre AS categoria,
        COALESCE(SUM(i.stock_actual), 0) AS stock_total,
        STRING_AGG(DISTINCT t.talla, ', ') AS tallas
      FROM Productos p
      JOIN Categorias c ON p.categoria_id = c.id_categoria
      LEFT JOIN Inventario i ON p.id_producto = i.producto_id
      LEFT JOIN Producto_Tallas pt ON p.id_producto = pt.id_producto
      LEFT JOIN Tallas t ON pt.id_talla = t.id_talla
    `;

    const params = [];
    if (categoriaId) {
      query += ` WHERE p.categoria_id = $1`;
      params.push(categoriaId);
    }

    query += ` GROUP BY p.id_producto, p.nombre, p.precio, p.estado, p.imagen, c.nombre`;

    // Contar total de productos
    let countQuery = `
      SELECT COUNT(DISTINCT p.id_producto) as total
      FROM Productos p
    `;
    if (categoriaId) {
      countQuery += ` WHERE p.categoria_id = $1`;
    }

    const countResult = await pool.query(countQuery, categoriaId ? [categoriaId] : []);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY p.id_producto DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      productos: result.rows,
      paginacion: {
        pagina_actual: page,
        total_paginas: Math.ceil(total / limit),
        total_productos: total,
        productos_por_pagina: limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

// Obtener un producto completo para edición
app.get("/productos-admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🟢 [BACKEND] GET /productos-admin/:id - ID solicitado:", id);

    // Obtener producto
    const productoResult = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM Productos p
       JOIN Categorias c ON p.categoria_id = c.id_categoria
       WHERE p.id_producto = $1`,
      [id]
    );

    if (productoResult.rows.length === 0) {
      console.log("🔴 [BACKEND] Producto no encontrado:", id);
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const producto = productoResult.rows[0];
    console.log("✅ [BACKEND] Producto encontrado:", producto);

    // Obtener tallas del producto
    const tallasResult = await pool.query(
      `SELECT t.* FROM Producto_Tallas pt
       JOIN Tallas t ON pt.id_talla = t.id_talla
       WHERE pt.id_producto = $1`,
      [id]
    );
    console.log("🟡 [BACKEND] Tallas del producto:", tallasResult.rows);


    // Obtener colores del producto con stock REAL (sumado por color)
    const coloresResult = await pool.query(
      `SELECT 
     c.id_color,
     c.nombre,
     c.codigo_hex,
     COALESCE(SUM(i.stock_actual), 0)::integer AS stock
   FROM Producto_Colores pc
   JOIN Colores c ON pc.id_color = c.id_color
   LEFT JOIN Inventario i 
     ON i.id_color = c.id_color
     AND i.producto_id = $1
   WHERE pc.id_producto = $1
   GROUP BY c.id_color, c.nombre, c.codigo_hex
   ORDER BY c.id_color`,
      [id]
    );



    console.log("🟡 [BACKEND] Colores del producto:", coloresResult.rows);

    // Obtener inventario
    const inventarioResult = await pool.query(
      `SELECT i.*, t.talla, c.nombre AS color_nombre
       FROM Inventario i
       JOIN Tallas t ON i.id_talla = t.id_talla
       JOIN Colores c ON i.id_color = c.id_color
       WHERE i.producto_id = $1`,
      [id]
    );

    const respuesta = {
      // Datos base del producto
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      estado: producto.estado,
      categoria_id: producto.categoria_id,
      imagen: producto.imagen, // Asegúrate que este nombre coincide con tu BD

      // Relaciones
      tallas: tallasResult.rows,
      colores: coloresResult.rows,

      // Inventario exactamente en el formato que espera el frontend
      inventario: inventarioResult.rows.map(i => ({
        id_color: i.id_color,
        id_talla: i.id_talla,
        stock_actual: i.stock_actual
      }))
    };


    console.log("✅ [BACKEND] Respuesta completa:", {
      ...respuesta,
      tallas_count: respuesta.tallas.length,
      colores_count: respuesta.colores.length
    });

    res.json(respuesta);
  } catch (error) {
    console.error("🔴 [BACKEND] Error al obtener producto:", error);
    res.status(500).json({ message: "Error al obtener producto" });
  }
});

// Crear nuevo producto
app.post("/productos-admin", async (req, res) => {
  const client = await pool.connect();

  try {
    const { nombre, descripcion, precio, estado, categoria_id, tallas_ids, colores_ids, imagen } = req.body;

    await client.query("BEGIN");


    const productoResult = await client.query(
      `INSERT INTO Productos (nombre, descripcion, precio, estado, categoria_id, imagen)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_producto`,
      [nombre, descripcion, precio, estado, categoria_id, imagen || null]
    );

    const productoId = productoResult.rows[0].id_producto;




    if (Array.isArray(tallas_ids)) {
      for (const tallaId of tallas_ids) {

        // Verificar existencia
        const existe = await client.query(
          `SELECT 1 FROM Producto_Tallas 
           WHERE id_producto = $1 AND id_talla = $2`,
          [productoId, tallaId]
        );

        if (existe.rows.length === 0) {
          await client.query(
            `INSERT INTO Producto_Tallas (id_producto, id_talla)
             VALUES ($1, $2)`,
            [productoId, tallaId]
          );
        }
      }
    }




    if (Array.isArray(colores_ids)) {
      for (const colorId of colores_ids) {

        // Verificar existencia
        const existe = await client.query(
          `SELECT 1 FROM Producto_Colores 
           WHERE id_producto = $1 AND id_color = $2`,
          [productoId, colorId]
        );

        if (existe.rows.length === 0) {
          await client.query(
            `INSERT INTO Producto_Colores (id_producto, id_color)
             VALUES ($1, $2)`,
            [productoId, colorId]
          );
        }
      }
    }




    if (Array.isArray(tallas_ids) && Array.isArray(colores_ids)) {

      const variantes = req.body.variantes || {}; // { colorId: { tallaId: stock } }

      for (const colorId of Object.keys(variantes)) {
        for (const tallaId of Object.keys(variantes[colorId])) {
          const stock = variantes[colorId][tallaId] ?? 0;

          await client.query(
            `INSERT INTO Inventario (producto_id, id_talla, id_color, stock_actual)
       VALUES ($1, $2, $3, $4)`,
            [productoId, Number(tallaId), Number(colorId), Number(stock)]
          );
        }
      }


    }


    // Registrar en historial
    const fechaCambio = getLimaNowUTC();
    await client.query(
      `INSERT INTO Historial_Productos (id_producto, usuario, campo_modificado, valor_nuevo, fecha_cambio)
       VALUES ($1, $2, $3, $4, $5)`,
      [productoId, "Sistema", "Creación", "Producto creado", fechaCambio]
    );





    await client.query("COMMIT");

    res.json({ success: true, id_producto: productoId });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Error al crear producto" });
  } finally {
    client.release();
  }
});


app.put("/productos-admin/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      nombre,
      descripcion,
      precio,
      estado,
      categoria_id,
      tallas_ids,
      colores_ids,
      tallas,
      colores,
      imagen
    } = req.body;

    if (!nombre || !descripcion || !precio || !estado || !categoria_id) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    await client.query("BEGIN");

    // Obtener datos anteriores
    const productoAnterior = await client.query(
      `SELECT imagen FROM Productos WHERE id_producto = $1`,
      [id]
    );

    if (productoAnterior.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const anterior = productoAnterior.rows[0];

    // Actualización de producto
    await client.query(
      `UPDATE Productos
       SET nombre=$1, descripcion=$2, precio=$3, estado=$4, categoria_id=$5, imagen=$6
       WHERE id_producto=$7`,
      [nombre, descripcion, precio, estado, categoria_id, imagen || anterior.imagen, id]
    );

    // Normalizar arrays
    const tallasBody = Array.isArray(tallas_ids)
      ? tallas_ids.map(Number)
      : Array.isArray(tallas)
        ? tallas.map(Number)
        : [];

    const coloresBody = Array.isArray(colores_ids)
      ? colores_ids.map(Number)
      : Array.isArray(colores)
        ? colores.map(Number)
        : [];


    const tallasExist = (
      await client.query(`SELECT id_talla FROM Producto_Tallas WHERE id_producto=$1`, [id])
    ).rows.map(r => Number(r.id_talla));

    const tallasAInsertar = tallasBody.filter(t => !tallasExist.includes(t));
    const tallasAEliminar = tallasExist.filter(t => !tallasBody.includes(t));

    if (tallasAEliminar.length > 0) {
      await client.query(
        `DELETE FROM Inventario WHERE producto_id=$1 AND id_talla = ANY($2::int[])`,
        [id, tallasAEliminar]
      );
      await client.query(
        `DELETE FROM Producto_Tallas WHERE id_producto=$1 AND id_talla = ANY($2::int[])`,
        [id, tallasAEliminar]
      );
    }

    for (const talla of tallasAInsertar) {
      await client.query(
        `INSERT INTO Producto_Tallas (id_producto,id_talla)
         VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [id, talla]
      );
    }


    const coloresExist = (
      await client.query(`SELECT id_color FROM Producto_Colores WHERE id_producto=$1`, [id])
    ).rows.map(r => Number(r.id_color));

    const coloresAInsertar = coloresBody.filter(c => !coloresExist.includes(c));
    const coloresAEliminar = coloresExist.filter(c => !coloresBody.includes(c));

    if (coloresAEliminar.length > 0) {
      await client.query(
        `DELETE FROM Inventario WHERE producto_id=$1 AND id_color = ANY($2::int[])`,
        [id, coloresAEliminar]
      );
      await client.query(
        `DELETE FROM Producto_Colores WHERE id_producto=$1 AND id_color = ANY($2::int[])`,
        [id, coloresAEliminar]
      );
    }

    for (const color of coloresAInsertar) {
      await client.query(
        `INSERT INTO Producto_Colores (id_producto,id_color)
         VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [id, color]
      );
    }


    const tallasFinales = (
      await client.query(`SELECT id_talla FROM Producto_Tallas WHERE id_producto=$1`, [id])
    ).rows.map(r => Number(r.id_talla));

    const coloresFinales = (
      await client.query(`SELECT id_color FROM Producto_Colores WHERE id_producto=$1`, [id])
    ).rows.map(r => Number(r.id_color));

    for (const colorId of coloresFinales) {
      for (const tallaId of tallasFinales) {
        const existe = await client.query(
          `SELECT 1 FROM Inventario 
           WHERE producto_id=$1 AND id_talla=$2 AND id_color=$3`,
          [id, tallaId, colorId]
        );

        if (existe.rows.length === 0) {
          await client.query(
            `INSERT INTO Inventario (producto_id, id_talla, id_color, stock_actual, ubicacion)
             VALUES ($1,$2,$3,0,'Almacén A')`,
            [id, tallaId, colorId]
          );
        }
      }
    }


    const { variantes } = req.body;

    if (variantes && typeof variantes === "object") {
      for (const colorId of Object.keys(variantes)) {
        for (const tallaId of Object.keys(variantes[colorId])) {
          const stockNuevo = variantes[colorId][tallaId];

          await client.query(
            `UPDATE Inventario
             SET stock_actual = $1
             WHERE producto_id = $2 
             AND id_color = $3 
             AND id_talla = $4`,
            [stockNuevo, id, colorId, tallaId]
          );
        }
      }
    }

    // Registrar cambios en historial
    const cambios = [];
    if (anterior.nombre !== nombre) cambios.push({ campo: "nombre", anterior: anterior.nombre, nuevo: nombre });
    if (anterior.descripcion !== descripcion) cambios.push({ campo: "descripcion", anterior: anterior.descripcion, nuevo: descripcion });
    if (anterior.precio !== precio) cambios.push({ campo: "precio", anterior: anterior.precio, nuevo: precio });
    if (anterior.estado !== estado) cambios.push({ campo: "estado", anterior: anterior.estado, nuevo: estado });
    if (anterior.categoria_id !== categoria_id) cambios.push({ campo: "categoria_id", anterior: anterior.categoria_id, nuevo: categoria_id });

    const fechaCambio = getLimaNowUTC();
    for (const cambio of cambios) {
      await client.query(
        `INSERT INTO Historial_Productos (id_producto, usuario, campo_modificado, valor_anterior, valor_nuevo, fecha_cambio)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, "Sistema", cambio.campo, String(cambio.anterior), String(cambio.nuevo), fechaCambio]
      );
    }




    await client.query("COMMIT");
    res.json({ success: true });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("🔴 Error actualizando producto:", error);
    res.status(500).json({ message: "Error al actualizar producto" });
  } finally {
    client.release();
  }
});


app.delete('/productos-admin/delete/:id', async (req, res) => {
  const id = req.params.id;
  console.log("🚨 DELETE REAL RECIBIDO:", id);

  try {
    await pool.query('BEGIN');

    // 1. Eliminar historial
    await pool.query(
      'DELETE FROM historial_productos WHERE id_producto = $1',
      [id]
    );

    // 2. Eliminar detalles de pedidos
    await pool.query(
      'DELETE FROM detalle_pedido WHERE producto_id = $1',
      [id]
    );

    // 3. Eliminar inventario
    await pool.query(
      'DELETE FROM inventario WHERE producto_id = $1',
      [id]
    );

    // 4. Eliminar tallas
    await pool.query(
      'DELETE FROM producto_tallas WHERE id_producto = $1',
      [id]
    );

    // 5. Eliminar colores
    await pool.query(
      'DELETE FROM producto_colores WHERE id_producto = $1',
      [id]
    );

    // 6. Finalmente eliminar producto
    await pool.query(
      'DELETE FROM productos WHERE id_producto = $1',
      [id]
    );

    await pool.query('COMMIT');

    res.json({ success: true, message: "Producto eliminado correctamente" });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("🔥 ERROR AL ELIMINAR:", error);
    res.status(500).json({ success: false, message: "Error al eliminar el producto" });
  }
});

app.put("/productos/:id/stock-color", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { color_id, stock, aplicar_a_todas_tallas = true, talla_id } = req.body;

    if (!color_id || typeof stock === "undefined") {
      return res.status(400).json({ message: "Faltan parámetros color_id o stock" });
    }

    const stockInt = parseInt(stock, 10);
    if (isNaN(stockInt) || stockInt < 0) {
      return res.status(400).json({ message: "Stock inválido" });
    }

    await client.query("BEGIN");

    const tallas = (
      await client.query(`SELECT id_talla FROM Producto_Tallas WHERE id_producto=$1`, [id])
    ).rows.map(r => Number(r.id_talla));

    if (tallas.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "El producto no tiene tallas registradas" });
    }

    await client.query(
      `INSERT INTO Producto_Colores (id_producto,id_color)
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [id, color_id]
    );

    for (const talla of tallas) {
      const existe = await client.query(
        `SELECT 1 FROM Inventario WHERE producto_id=$1 AND id_talla=$2 AND id_color=$3`,
        [id, talla, color_id]
      );

      if (existe.rows.length === 0) {
        await client.query(
          `INSERT INTO Inventario (producto_id,id_talla,id_color,stock_actual,ubicacion)
           VALUES ($1,$2,$3,0,'Almacén A')`,
          [id, talla, color_id]
        );
      }
    }

    // TODAS LAS TALLAS
    if (aplicar_a_todas_tallas === true) {
      await client.query(
        `UPDATE Inventario
         SET stock_actual=$1, fecha_actualizacion=NOW()
         WHERE producto_id=$2 AND id_color=$3`,
        [stockInt, id, color_id]
      );

      await client.query("COMMIT");
      return res.json({ success: true, message: "Stock actualizado en todas las tallas" });
    }

    // SOLO UNA TALLA
    if (talla_id) {
      if (!tallas.includes(Number(talla_id))) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "La talla no pertenece al producto" });
      }

      await client.query(
        `UPDATE Inventario
         SET stock_actual=$1, fecha_actualizacion=NOW()
         WHERE producto_id=$2 AND id_color=$3 AND id_talla=$4`,
        [stockInt, id, color_id, talla_id]
      );

      await client.query("COMMIT");
      return res.json({ success: true, message: "Stock actualizado para la talla indicada" });
    }

    await client.query("ROLLBACK");
    res.status(400).json({
      message: "Debe indicar aplicar_a_todas_tallas=true o enviar talla_id"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error stock-color:", error);
    res.status(500).json({ message: "Error al actualizar stock por color" });
  } finally {
    client.release();
  }
});


app.post("/productos/:id/crear-inventario-color", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { color_id } = req.body;

    if (!color_id) return res.status(400).json({ message: "Falta color_id" });

    await client.query("BEGIN");

    const prod = await client.query(`SELECT 1 FROM Productos WHERE id_producto=$1`, [id]);
    if (prod.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    await client.query(
      `INSERT INTO Producto_Colores (id_producto,id_color)
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [id, color_id]
    );

    const tallas = (
      await client.query(`SELECT id_talla FROM Producto_Tallas WHERE id_producto=$1`, [id])
    ).rows.map(r => r.id_talla);

    if (tallas.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "El producto no tiene tallas registradas" });
    }

    for (const talla of tallas) {
      const existe = await client.query(
        `SELECT 1 FROM Inventario WHERE producto_id=$1 AND id_talla=$2 AND id_color=$3`,
        [id, talla, color_id]
      );

      if (existe.rows.length === 0) {
        await client.query(
          `INSERT INTO Inventario (producto_id,id_talla,id_color,stock_actual,ubicacion)
           VALUES ($1,$2,$3,0,'Almacén A')`,
          [id, talla, color_id]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error crear inventario color:", error);
    res.status(500).json({ message: "Error al crear inventario color" });
  } finally {
    client.release();
  }
});



//DashBoard
// Obtener estadísticas de ventas con filtro de tiempo
app.get("/dashboard/ventas", async (req, res) => {
  try {
    const { periodo } = req.query || 'mes'; // 'dia', 'mes', 'año'

    // ---------------- ZONA HORARIA LIMA ----------------
    const ahoraLima = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
    );

    let fechaInicio = new Date(ahoraLima);
    let fechaFin = new Date(ahoraLima);
    fechaFin.setHours(23, 59, 59, 999);

    switch (periodo) {
      case 'dia':
        fechaInicio.setHours(0, 0, 0, 0);
        break;

      case 'mes':
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        fechaInicio.setHours(0, 0, 0, 0);
        break;

      case 'año':
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
        fechaInicio.setHours(0, 0, 0, 0);
        break;

      default:
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        fechaInicio.setHours(0, 0, 0, 0);
    }

    console.log("🔵 [DASHBOARD] LIMA:", { periodo, fechaInicio, fechaFin });

    // ---------------- VENTAS DEL PERIODO ACTUAL ----------------
    const ventasResult = await pool.query(
      `SELECT COALESCE(SUM(ped.total), 0) as total_ventas
       FROM Pedidos ped
       WHERE ped.estado = 'Pagado'
       AND ped.fecha_pedido BETWEEN $1 AND $2`,
      [fechaInicio, fechaFin]
    );

    const ventasTotales = parseFloat(ventasResult.rows[0].total_ventas || 0);

    // ---------------- PERIODO ANTERIOR ----------------
    let inicioPeriodoAnterior = new Date(fechaInicio);
    let finPeriodoAnterior = new Date(fechaInicio);

    if (periodo === 'dia') {
      inicioPeriodoAnterior.setDate(inicioPeriodoAnterior.getDate() - 1);
      inicioPeriodoAnterior.setHours(0, 0, 0, 0);

      finPeriodoAnterior = new Date(inicioPeriodoAnterior);
      finPeriodoAnterior.setHours(23, 59, 59, 999);

    } else if (periodo === 'mes') {
      inicioPeriodoAnterior.setMonth(inicioPeriodoAnterior.getMonth() - 1);
      inicioPeriodoAnterior.setHours(0, 0, 0, 0);

      finPeriodoAnterior = new Date(inicioPeriodoAnterior);
      finPeriodoAnterior.setMonth(finPeriodoAnterior.getMonth() + 1);

    } else if (periodo === 'año') {
      inicioPeriodoAnterior.setFullYear(inicioPeriodoAnterior.getFullYear() - 1);
      inicioPeriodoAnterior.setMonth(0, 0);
      inicioPeriodoAnterior.setHours(0, 0, 0, 0);

      finPeriodoAnterior = new Date(inicioPeriodoAnterior);
      finPeriodoAnterior.setFullYear(finPeriodoAnterior.getFullYear() + 1);
    }

    const ventasPeriodoAnteriorResult = await pool.query(
      `SELECT COALESCE(SUM(ped.total), 0) as total_ventas
       FROM Pedidos ped
       WHERE ped.estado = 'Pagado'
       AND ped.fecha_pedido BETWEEN $1 AND $2`,
      [inicioPeriodoAnterior, finPeriodoAnterior]
    );

    const ventasMesAnterior = parseFloat(ventasPeriodoAnteriorResult.rows[0].total_ventas || 0);

    let tasaCrecimiento = 0;
    if (ventasMesAnterior > 0) {
      tasaCrecimiento = ((ventasTotales - ventasMesAnterior) / ventasMesAnterior) * 100;
    } else if (ventasTotales > 0) {
      tasaCrecimiento = 100;
    }

    // ---------------- CATEGORÍAS ----------------
    const categoriasResult = await pool.query(
      `SELECT 
        c.nombre as categoria,
        COUNT(DISTINCT dp.producto_id) as cantidad_productos,
        SUM(dp.cantidad) as unidades_vendidas,
        COALESCE(SUM(dp.subtotal), 0) as total_vendido
       FROM Detalle_Pedido dp
       JOIN Productos pr ON dp.producto_id = pr.id_producto
       JOIN Categorias c ON pr.categoria_id = c.id_categoria
       JOIN Pedidos ped ON dp.pedido_id = ped.id_pedido
       WHERE ped.estado = 'Pagado'
       AND ped.fecha_pedido BETWEEN $1 AND $2
       GROUP BY c.id_categoria, c.nombre
       ORDER BY total_vendido DESC
       LIMIT 5`,
      [fechaInicio, fechaFin]
    );

    // ---------------- PARAMETRIZACIONES ----------------
    const parametrosResult = await pool.query(
      `SELECT codigo, valor FROM Parametrizaciones 
       WHERE codigo IN ('MINIMO_VENTAS_MENSUAL', 'TASA_CRECIMIENTO_MENSUAL')`
    );

    const parametros = {};
    parametrosResult.rows.forEach(p => {
      parametros[p.codigo] = parseFloat(p.valor);
    });

    let minimoEsperado = parametros.MINIMO_VENTAS_MENSUAL || 5000;
    if (periodo === 'dia') minimoEsperado /= 30;
    if (periodo === 'año') minimoEsperado *= 12;

    res.json({
      ventas_totales: ventasTotales,
      tasa_crecimiento: tasaCrecimiento,
      categorias_mas_vendidas: categoriasResult.rows || [],
      parametros: {
        minimo_ventas: minimoEsperado,
        tasa_crecimiento_minima: parametros.TASA_CRECIMIENTO_MENSUAL || 10
      },
      periodo
    });

  } catch (error) {
    console.error("Error al obtener estadísticas de ventas:", error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
});



app.get("/dashboard/ventas-recientes", async (req, res) => {
  try {
    const periodo = req.query.periodo || "dia";

    // ------------------------- LIMA TIME -------------------------
    const ahoraLima = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
    );

    let fechaInicioLima;
    let fechaFinLima;

    switch (periodo) {
      case "dia":
        fechaInicioLima = new Date(ahoraLima);
        fechaInicioLima.setHours(0, 0, 0, 0);
        fechaFinLima = new Date(fechaInicioLima);
        fechaFinLima.setDate(fechaFinLima.getDate() + 1);
        break;

      case "mes":
        fechaInicioLima = new Date(ahoraLima.getFullYear(), ahoraLima.getMonth(), 1);
        fechaFinLima = new Date(ahoraLima.getFullYear(), ahoraLima.getMonth() + 1, 1);
        break;

      case "año":
        fechaInicioLima = new Date(ahoraLima.getFullYear(), 0, 1);
        fechaFinLima = new Date(ahoraLima.getFullYear() + 1, 0, 1);
        break;

      default:
        return res.status(400).json({ message: "Periodo inválido" });
    }

    // Convertir fechas a UTC
    const fechaInicioUTC = fechaInicioLima.toISOString();
    const fechaFinUTC = fechaFinLima.toISOString();

    console.log("🟦 PERIODO:", periodo, fechaInicioUTC, fechaFinUTC);

    // ------------------------- QUERY SIN PAGINACIÓN -------------------------
    const ventasResult = await pool.query(
      `SELECT 
         p.id_pedido,
         p.fecha_pedido 
           AT TIME ZONE 'UTC' 
           AT TIME ZONE 'America/Lima' AS fecha_pedido,
         p.total AS monto,
         p.cliente_nombre,
         COALESCE(pag.metodo_pago, 'N/A') AS metodo_pago,
         pag.fecha_pago 
           AT TIME ZONE 'UTC' 
           AT TIME ZONE 'America/Lima' AS fecha_pago
       FROM Pedidos p
       LEFT JOIN Pagos pag ON p.id_pedido = pag.pedido_id
       WHERE p.estado = 'Pagado'
       AND p.fecha_pedido >= $1
       AND p.fecha_pedido < $2
       ORDER BY p.fecha_pedido DESC`,
      [fechaInicioUTC, fechaFinUTC]
    );

    // DEVOLVER SOLO VENTAS
    res.json({
      ventas: ventasResult.rows
    });

  } catch (error) {
    console.error("Error al obtener ventas recientes:", error);
    res.status(500).json({ message: "Error al obtener ventas recientes" });
  }
});




// Obtener detalle de una venta
app.get("/dashboard/venta/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información del pedido
    const pedidoResult = await pool.query(
      `SELECT * FROM Pedidos WHERE id_pedido = $1`,
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Obtener detalles del pedido
    const detalleResult = await pool.query(
      `SELECT 
        dp.*,
        pr.nombre as producto_nombre,
        pr.imagen as producto_imagen,
        t.talla,
        c.nombre as color_nombre,
        cat.nombre as categoria
       FROM Detalle_Pedido dp
       JOIN Productos pr ON dp.producto_id = pr.id_producto
       JOIN Tallas t ON dp.id_talla = t.id_talla
       JOIN Colores c ON dp.id_color = c.id_color
       JOIN Categorias cat ON pr.categoria_id = cat.id_categoria
       WHERE dp.pedido_id = $1`,
      [id]
    );

    // Obtener información del pago
    const pagoResult = await pool.query(
      `SELECT * FROM Pagos WHERE pedido_id = $1`,
      [id]
    );

    res.json({
      pedido: pedidoResult.rows[0],
      detalles: detalleResult.rows,
      pago: pagoResult.rows[0] || null
    });
  } catch (error) {
    console.error("Error al obtener detalle de venta:", error);
    res.status(500).json({ message: "Error al obtener detalle de venta" });
  }
});




// --- RUTA: serie de ventas para graficar ---
app.get("/dashboard/ventas-series", async (req, res) => {
  try {
    const periodo = (req.query.periodo || "mes").toLowerCase(); // 'dia'|'mes'|'año'
    const fechaFin = new Date();
    fechaFin.setHours(23, 59, 59, 999);

    let fechaInicio;
    let groupBy; // SQL date_trunc arg
    if (periodo === "dia") {
      fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 1);
      fechaInicio.setHours(0, 0, 0, 0);
      groupBy = "hour";
    } else if (periodo === "año" || periodo === "anio") {
      fechaInicio = new Date();
      fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
      fechaInicio.setHours(0, 0, 0, 0);
      groupBy = "month";
    } else { // mes por defecto
      fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
      fechaInicio.setHours(0, 0, 0, 0);
      groupBy = "day";
    }

    // Postgres: agrupamos con date_trunc
    const q = `
      SELECT date_trunc($3, p.fecha_pedido) as periodo, COALESCE(SUM(p.total), 0) as total
      FROM Pedidos p
      WHERE p.estado = 'Pagado'
        AND p.fecha_pedido >= $1
        AND p.fecha_pedido <= $2
      GROUP BY periodo
      ORDER BY periodo
    `;

    const result = await pool.query(q, [fechaInicio, fechaFin, groupBy]);
    // Transformar periodo a string legible en frontend
    const rows = result.rows.map(r => ({
      periodo: r.periodo ? r.periodo.toISOString() : null,
      total: parseFloat(r.total || 0)
    }));

    res.json(rows);
  } catch (err) {
    console.error("Error /dashboard/ventas-series:", err);
    res.status(500).json({ message: "Error obteniendo serie de ventas" });
  }
});

// --- RUTA: productos más vendidos (top N) ---
app.get("/dashboard/productos-mas-vendidos", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const { periodo } = req.query || 'mes';

    // Rango de fechas CORRECTO
    let fechaInicio;
    const fechaFin = new Date();
    fechaFin.setHours(23, 59, 59, 999);

    switch (periodo) {
      case "dia":
        fechaInicio = new Date();
        fechaInicio.setHours(0, 0, 0, 0);  // HOY, no ayer
        break;

      case "año":
      case "anio":
        fechaInicio = new Date();
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
        fechaInicio.setHours(0, 0, 0, 0);
        break;

      case "mes":
      default:
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        fechaInicio.setHours(0, 0, 0, 0);
    }

    const q = `
      SELECT pr.id_producto, pr.nombre as producto, COALESCE(SUM(dp.cantidad),0) as unidades_vendidas
      FROM Detalle_Pedido dp
      JOIN Pedidos p ON dp.pedido_id = p.id_pedido
      JOIN Productos pr ON dp.producto_id = pr.id_producto
      WHERE p.estado = 'Pagado'
        AND p.fecha_pedido >= $1 AND p.fecha_pedido <= $2
      GROUP BY pr.id_producto, pr.nombre
      ORDER BY unidades_vendidas DESC
      LIMIT $3
    `;

    const result = await pool.query(q, [fechaInicio, fechaFin, limit]);

    res.json(
      result.rows.map(r => ({
        producto: r.producto,
        unidades: parseInt(r.unidades_vendidas)
      }))
    );

  } catch (err) {
    console.error("Error /dashboard/productos-mas-vendidos:", err);
    res.status(500).json({ message: "Error obteniendo productos más vendidos" });
  }
});


// ========== ENDPOINTS PARA PARAMETRIZACIONES ==========

// Obtener todas las parametrizaciones
app.get("/parametrizaciones", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM Parametrizaciones ORDER BY codigo`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener parametrizaciones:", error);
    res.status(500).json({ message: "Error al obtener parametrizaciones" });
  }
});

// Actualizar parametrización
app.put("/parametrizaciones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { valor } = req.body;

    if (valor === undefined || valor === null) {
      return res.status(400).json({ message: "El valor es obligatorio" });
    }

    const fechaActualizacion = getLimaNowUTC();
    const result = await pool.query(
      `UPDATE Parametrizaciones 
       SET valor = $1, fecha_actualizacion = $3
       WHERE id_parametro = $2
       RETURNING *`,
      [valor, id, fechaActualizacion]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Parametrización no encontrada" });
    }

    res.json({ success: true, parametrizacion: result.rows[0] });
  } catch (error) {
    console.error("Error al actualizar parametrización:", error);
    res.status(500).json({ message: "Error al actualizar parametrización" });
  }
});




app.listen(4000, () => {
  console.log("Servidor backend corriendo en http://localhost:4000");
});
