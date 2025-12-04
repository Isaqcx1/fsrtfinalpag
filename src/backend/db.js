const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "db.ldsrwwydthhytowhhzfv.supabase.co",
  database: "postgres",
  password: "root",
  port: 5432,
  // Configurar zona horaria para todas las conexiones
  options: '-c timezone=America/Lima'
});

// Configurar zona horaria en cada conexión nueva
pool.on('connect', async (client) => {
  try {
    await client.query("SET timezone = 'America/Lima'");
    console.log("✅ Zona horaria configurada: America/Lima");
  } catch (error) {
    console.error("❌ Error al configurar zona horaria:", error);
  }
});

// Manejar errores del pool
pool.on("error", (err) => {
  console.error("❌ Error inesperado en el pool de conexiones:", err);
});



module.exports = pool;
