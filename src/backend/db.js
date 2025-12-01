const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "db.ldsrwwydthhytowhhzfv.supabase.co",
  database: "postgres",
  password: "root",
  port: 5432,
});



// Manejar errores del pool
pool.on("error", (err) => {
  console.error("❌ Error inesperado en el pool de conexiones:", err);
});



module.exports = pool;
