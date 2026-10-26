const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tareas (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      completada BOOLEAN DEFAULT false,
      creada TIMESTAMP DEFAULT NOW()
    )`);
}

app.get('/', (req, res) => res.json({ servicio: 'Sistema Moderno (Node/Express)', estado: 'ok' }));

app.get('/api/tareas', async (req, res) => {
  const r = await pool.query('SELECT * FROM tareas ORDER BY id DESC');
  res.json(r.rows);
});

app.post('/api/tareas', async (req, res) => {
  const { titulo } = req.body;
  if (!titulo || typeof titulo !== 'string' || !titulo.trim())
    return res.status(400).json({ error: 'titulo es obligatorio' });
  const r = await pool.query('INSERT INTO tareas (titulo) VALUES ($1) RETURNING *', [titulo.trim()]);
  res.status(201).json(r.rows[0]);
});

app.put('/api/tareas/:id', async (req, res) => {
  const { titulo, completada } = req.body;
  const r = await pool.query(
    'UPDATE tareas SET titulo = COALESCE($1, titulo), completada = COALESCE($2, completada) WHERE id = $3 RETURNING *',
    [titulo ?? null, completada ?? null, req.params.id]);
  if (!r.rowCount) return res.status(404).json({ error: 'no encontrada' });
  res.json(r.rows[0]);
});

app.delete('/api/tareas/:id', async (req, res) => {
  const r = await pool.query('DELETE FROM tareas WHERE id = $1', [req.params.id]);
  if (!r.rowCount) return res.status(404).json({ error: 'no encontrada' });
  res.status(204).end();
});

const port = process.env.PORT || 3000;
(async () => {
  for (let i = 0; i < 15; i++) {
    try { await init(); break; }
    catch (e) { console.log('Esperando BD...', e.message); await new Promise(r => setTimeout(r, 4000)); }
  }
  app.listen(port, () => console.log(`API escuchando en ${port}`));
})();
