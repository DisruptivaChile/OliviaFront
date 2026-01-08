const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'olivia_zapatos_db',
  user: process.env.DB_USER || 'olivia_user',
  password: process.env.DB_PASSWORD,
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Evento cuando se conecta exitosamente
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

// Evento de error
pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
  process.exit(-1);
});

// Función helper para ejecutar queries
const query = (text, params) => pool.query(text, params);

// Función para obtener un cliente del pool
const getClient = () => pool.connect();

module.exports = {
  query,
  getClient,
  pool
};
