const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones a PostgreSQL
if (!process.env.DB_PASSWORD) {
    console.warn('⚠️  Cuidado: DB_PASSWORD no está definida en el archivo .env');
}

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'olivia_zapatos_db',
  user: process.env.DB_USER || 'olivia_user',
  password: String(process.env.DB_PASSWORD || ''), // Forzamos que sea un string
  max: 20, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(poolConfig);

// Evento cuando se conecta exitosamente
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

// Evento de error
pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err.message);
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
