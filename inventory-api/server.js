const express = require('express');
const odbc = require('odbc');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const selfsigned = require('selfsigned');

const app = express();
app.use(cors({ origin: true, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.options('*', cors());

// Use ODBC Driver 18 and allow trusted connection; trust server certificate for local dev
const connectionString = `Driver={ODBC Driver 18 for SQL Server};Server=localhost;Database=Inventory_Database;Trusted_Connection=Yes;Encrypt=Yes;TrustServerCertificate=Yes;`;

app.get('/api/items', async (req, res) => {
  console.log('[GET] /api/items');
  let connection;
  try {
    connection = await odbc.connect(connectionString);
    const result = await connection.query('SELECT * FROM dbo.inventory_count_table');
    const rows = Array.isArray(result) ? result : (result && result.rows ? result.rows : []);
    res.set('Cache-Control', 'no-store');
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/items:', err);
    res.status(500).send('[odbc] ' + (err && err.message ? err.message : 'Error connecting to the database'));
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Simple health-check endpoint
app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, serverTime: new Date().toISOString() });
});

// Support HTTPS with self-signed cert when launched as `node server.js https`
const useHttps = process.argv.includes('https');
if (useHttps) {
  let credentials;
  try {
    // Prefer persisted certs if provided (recommended with mkcert)
    const certPath = require('path').join(__dirname, 'certs', 'cert.pem');
    const keyPath = require('path').join(__dirname, 'certs', 'key.pem');
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      credentials = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
      console.log('Using provided HTTPS certificate from ./certs');
    }
  } catch (_) {}

  if (!credentials) {
    const attrs = [{ name: 'commonName', value: '192.168.31.57' }];
    const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });
    credentials = { key: pems.private, cert: pems.cert };
    console.log('Using self-signed runtime certificate');
  }

  const server = https.createServer(credentials, app);
  server.listen(3001, '0.0.0.0', () => console.log('API running on HTTPS port 3001'));
} else {
  app.listen(3001, '0.0.0.0', () => console.log('API running on HTTP port 3001'));
}
