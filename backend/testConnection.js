const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
      host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
})

pool.query('SELECT NOW()')
  .then(res => {
    console.log('Conexão OK! Hora do servidor:', res.rows[0]);
    pool.end();
  })
  .catch(err => {
    console.error('Erro de conexão:', err.message);
    pool.end();
  });