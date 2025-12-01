const express = require("express");
const cors = require("cors");
const pool = require("./db");
const { validarConexion } = require("./db");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());

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
    const result = await pool.query("SELECT NOW() as server_time, version() as db_version");
    res.json({
      status: "connected",
      server_time: result.rows[0].server_time,
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
    const result = await pool.query(`
      SELECT p.*, c.nombre AS categoria
      FROM Productos p
      JOIN Categorias c ON p.categoria_id = c.id_categoria
    `);
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

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error(error);
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


app.get("/producto/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT i.*, t.talla, c.nombre AS color
      FROM Inventario i
      JOIN Tallas t ON i.id_talla = t.id_talla
      JOIN Colores c ON i.id_color = c.id_color
      WHERE i.producto_id = $1
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener stock" });
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

    const result = await pool.query(
      `INSERT INTO Pedidos (cliente_nombre, cliente_email, direccion, telefono, estado, total)
       VALUES ($1, $2, $3, $4, 'Pendiente', $5)
       RETURNING id_pedido`,
      [cliente_nombre, cliente_email, direccion, telefono, total]
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

     
      await client.query(
        `UPDATE Inventario 
         SET stock_actual = stock_actual - $1
         WHERE producto_id = $2 AND id_talla = $3 AND id_color = $4`,
        [cantidad, productoId, tallaId, colorId]
      );
    }

    
    await client.query(
      `INSERT INTO Pagos (pedido_id, metodo_pago, monto)
       VALUES ($1, $2, $3)`,
      [pedido_id, metodo_pago, total]
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

// ========== ENDPOINTS PARA MANTENIMIENTO DE PRODUCTOS ==========

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

    // Obtener colores del producto
    const coloresResult = await pool.query(
      `SELECT c.* FROM Producto_Colores pc
       JOIN Colores c ON pc.id_color = c.id_color
       WHERE pc.id_producto = $1`,
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
      ...producto,
      tallas: tallasResult.rows,
      colores: coloresResult.rows,
      inventario: inventarioResult.rows
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

    // LOG BACKEND: Datos recibidos
    console.log("🟢 [BACKEND] POST /productos-admin - Datos recibidos:", {
      nombre,
      descripcion,
      precio,
      estado,
      categoria_id,
      tallas_ids,
      colores_ids,
      imagen,
      tipo_tallas_ids: typeof tallas_ids,
      tipo_colores_ids: typeof colores_ids,
      es_array_tallas: Array.isArray(tallas_ids),
      es_array_colores: Array.isArray(colores_ids)
    });

    // Validaciones
    if (!nombre || !descripcion || !precio || !estado || !categoria_id) {
      console.log("🔴 [BACKEND] Validación fallida: Faltan campos obligatorios");
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    if (precio <= 0) {
      console.log("🔴 [BACKEND] Validación fallida: Precio inválido");
      return res.status(400).json({ message: "El precio debe ser mayor a 0" });
    }

    if (!["Activo", "Inactivo", "Pendiente de actualización"].includes(estado)) {
      console.log("🔴 [BACKEND] Validación fallida: Estado inválido");
      return res.status(400).json({ message: "Estado inválido" });
    }

    await client.query("BEGIN");

    // Insertar producto
    const productoResult = await client.query(
      `INSERT INTO Productos (nombre, descripcion, precio, estado, categoria_id, imagen)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_producto`,
      [nombre, descripcion, precio, estado, categoria_id, imagen || null]
    );

    const productoId = productoResult.rows[0].id_producto;
    console.log("✅ [BACKEND] Producto creado con ID:", productoId);

    // Asociar tallas (múltiples)
    if (Array.isArray(tallas_ids) && tallas_ids.length > 0) {
      console.log("🟢 [BACKEND] Insertando tallas:", tallas_ids);
      for (const tallaId of tallas_ids) {
        const tallaIdInt = parseInt(tallaId);
        if (!isNaN(tallaIdInt)) {
          const insertResult = await client.query(
            `INSERT INTO Producto_Tallas (id_producto, id_talla) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [productoId, tallaIdInt]
          );
          console.log(`  ✅ Talla ${tallaIdInt} insertada`);
        } else {
          console.log(`  ⚠️ Talla inválida (no es número): ${tallaId}`);
        }
      }
    } else {
      console.log("⚠️ [BACKEND] No se proporcionaron tallas o el array está vacío");
    }

    // Asociar colores (múltiples)
    if (Array.isArray(colores_ids) && colores_ids.length > 0) {
      console.log("🟢 [BACKEND] Insertando colores:", colores_ids);
      for (const colorId of colores_ids) {
        const colorIdInt = parseInt(colorId);
        if (!isNaN(colorIdInt)) {
          const insertResult = await client.query(
            `INSERT INTO Producto_Colores (id_producto, id_color) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [productoId, colorIdInt]
          );
          console.log(`  ✅ Color ${colorIdInt} insertado`);
        } else {
          console.log(`  ⚠️ Color inválido (no es número): ${colorId}`);
        }
      }
    } else {
      console.log("⚠️ [BACKEND] No se proporcionaron colores o el array está vacío");
    }

    // Verificar resultados finales
    const tallasFinales = await client.query(
      `SELECT id_talla FROM Producto_Tallas WHERE id_producto = $1`,
      [productoId]
    );
    const coloresFinales = await client.query(
      `SELECT id_color FROM Producto_Colores WHERE id_producto = $1`,
      [productoId]
    );
    console.log("✅ [BACKEND] Estado final - Tallas:", tallasFinales.rows, "Colores:", coloresFinales.rows);

    // Registrar en historial
    await client.query(
      `INSERT INTO Historial_Productos (id_producto, usuario, campo_modificado, valor_nuevo)
       VALUES ($1, $2, $3, $4)`,
      [productoId, "Sistema", "Creación", "Producto creado"]
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

// Actualizar producto
app.put("/productos-admin/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, estado, categoria_id, tallas_ids, colores_ids, imagen } = req.body;

    // LOG BACKEND: Datos recibidos
    console.log("🟢 [BACKEND] PUT /productos-admin/:id - Datos recibidos:", {
      id,
      nombre,
      descripcion,
      precio,
      estado,
      categoria_id,
      tallas_ids,
      colores_ids,
      imagen,
      tipo_tallas_ids: typeof tallas_ids,
      tipo_colores_ids: typeof colores_ids,
      es_array_tallas: Array.isArray(tallas_ids),
      es_array_colores: Array.isArray(colores_ids)
    });

    // Validaciones
    if (!nombre || !descripcion || !precio || !estado || !categoria_id) {
      console.log("🔴 [BACKEND] Validación fallida: Faltan campos obligatorios");
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    if (precio <= 0) {
      console.log("🔴 [BACKEND] Validación fallida: Precio inválido");
      return res.status(400).json({ message: "El precio debe ser mayor a 0" });
    }

    if (!["Activo", "Inactivo", "Pendiente de actualización"].includes(estado)) {
      console.log("🔴 [BACKEND] Validación fallida: Estado inválido");
      return res.status(400).json({ message: "Estado inválido" });
    }

    await client.query("BEGIN");

    // Obtener valores anteriores para historial
    const productoAnterior = await client.query(
      `SELECT nombre, descripcion, precio, estado, categoria_id, imagen
       FROM Productos WHERE id_producto = $1`,
      [id]
    );

    if (productoAnterior.rows.length === 0) {
      await client.query("ROLLBACK");
      console.log("🔴 [BACKEND] Producto no encontrado:", id);
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const anterior = productoAnterior.rows[0];

    // Actualizar producto
    await client.query(
      `UPDATE Productos 
       SET nombre = $1, descripcion = $2, precio = $3, estado = $4, categoria_id = $5, imagen = $6
       WHERE id_producto = $7`,
      [nombre, descripcion, precio, estado, categoria_id, imagen || anterior.imagen, id]
    );

    console.log("✅ [BACKEND] Producto actualizado");

    // Obtener tallas existentes antes de eliminar
    const tallasExistentes = await client.query(
      `SELECT id_talla FROM Producto_Tallas WHERE id_producto = $1`,
      [id]
    );
    console.log("🟡 [BACKEND] Tallas existentes antes de actualizar:", tallasExistentes.rows);

    // Eliminar tallas existentes y agregar nuevas
    const deleteTallasResult = await client.query(
      `DELETE FROM Producto_Tallas WHERE id_producto = $1`,
      [id]
    );
    console.log("🟡 [BACKEND] Tallas eliminadas:", deleteTallasResult.rowCount);

    if (Array.isArray(tallas_ids) && tallas_ids.length > 0) {
      console.log("🟢 [BACKEND] Insertando tallas:", tallas_ids);
      for (const tallaId of tallas_ids) {
        const tallaIdInt = parseInt(tallaId);
        if (!isNaN(tallaIdInt)) {
          const insertResult = await client.query(
            `INSERT INTO Producto_Tallas (id_producto, id_talla) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [id, tallaIdInt]
          );
          console.log(`  ✅ Talla ${tallaIdInt} insertada`);
        } else {
          console.log(`  ⚠️ Talla inválida (no es número): ${tallaId}`);
        }
      }
    } else {
      console.log("⚠️ [BACKEND] No se proporcionaron tallas o el array está vacío");
    }

    // Obtener colores existentes antes de eliminar
    const coloresExistentes = await client.query(
      `SELECT id_color FROM Producto_Colores WHERE id_producto = $1`,
      [id]
    );
    console.log("🟡 [BACKEND] Colores existentes antes de actualizar:", coloresExistentes.rows);

    // Eliminar colores existentes y agregar nuevos
    const deleteColoresResult = await client.query(
      `DELETE FROM Producto_Colores WHERE id_producto = $1`,
      [id]
    );
    console.log("🟡 [BACKEND] Colores eliminados:", deleteColoresResult.rowCount);

    if (Array.isArray(colores_ids) && colores_ids.length > 0) {
      console.log("🟢 [BACKEND] Insertando colores:", colores_ids);
      for (const colorId of colores_ids) {
        const colorIdInt = parseInt(colorId);
        if (!isNaN(colorIdInt)) {
          const insertResult = await client.query(
            `INSERT INTO Producto_Colores (id_producto, id_color) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [id, colorIdInt]
          );
          console.log(`  ✅ Color ${colorIdInt} insertado`);
        } else {
          console.log(`  ⚠️ Color inválido (no es número): ${colorId}`);
        }
      }
    } else {
      console.log("⚠️ [BACKEND] No se proporcionaron colores o el array está vacío");
    }

    // Verificar resultados finales
    const tallasFinales = await client.query(
      `SELECT id_talla FROM Producto_Tallas WHERE id_producto = $1`,
      [id]
    );
    const coloresFinales = await client.query(
      `SELECT id_color FROM Producto_Colores WHERE id_producto = $1`,
      [id]
    );
    console.log("✅ [BACKEND] Estado final - Tallas:", tallasFinales.rows, "Colores:", coloresFinales.rows);

    // Registrar cambios en historial
    const cambios = [];
    if (anterior.nombre !== nombre) cambios.push({ campo: "nombre", anterior: anterior.nombre, nuevo: nombre });
    if (anterior.descripcion !== descripcion) cambios.push({ campo: "descripcion", anterior: anterior.descripcion, nuevo: descripcion });
    if (anterior.precio !== precio) cambios.push({ campo: "precio", anterior: anterior.precio, nuevo: precio });
    if (anterior.estado !== estado) cambios.push({ campo: "estado", anterior: anterior.estado, nuevo: estado });
    if (anterior.categoria_id !== categoria_id) cambios.push({ campo: "categoria_id", anterior: anterior.categoria_id, nuevo: categoria_id });

    for (const cambio of cambios) {
      await client.query(
        `INSERT INTO Historial_Productos (id_producto, usuario, campo_modificado, valor_anterior, valor_nuevo)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, "Sistema", cambio.campo, String(cambio.anterior), String(cambio.nuevo)]
      );
    }

    await client.query("COMMIT");

    res.json({ success: true });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Error al actualizar producto" });
  } finally {
    client.release();
  }
});

// Eliminación lógica (cambiar estado a Inactivo)
app.delete("/productos-admin/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // Verificar que el producto existe
    const producto = await client.query(
      `SELECT estado FROM Productos WHERE id_producto = $1`,
      [id]
    );

    if (producto.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Cambiar estado a Inactivo
    await client.query(
      `UPDATE Productos SET estado = 'Inactivo' WHERE id_producto = $1`,
      [id]
    );

    // Registrar en historial
    await client.query(
      `INSERT INTO Historial_Productos (id_producto, usuario, campo_modificado, valor_anterior, valor_nuevo)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, "Sistema", "estado", producto.rows[0].estado, "Inactivo"]
    );

    await client.query("COMMIT");

    res.json({ success: true });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Error al eliminar producto" });
  } finally {
    client.release();
  }
});












// Servidor
app.listen(4000, () => {
  console.log("Servidor backend corriendo en http://localhost:4000");
});
