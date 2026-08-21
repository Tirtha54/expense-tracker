require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbConfig = {
  server: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Test route
app.get('/', (req, res) => {
  res.send('API working');
});

// Test DB connection route
app.get('/api/db-test', async (req, res) => {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query('SELECT 1 + 1 AS result');
    res.json({ dbConnected: true, result: result.recordset[0].result });
  } catch (err) {
    res.status(500).json({ dbConnected: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});