import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const result = await pool.query("SELECT * FROM categories ORDER BY name");
      res.json(result.rows);
    } else if (req.method === "POST") {
      const { name } = req.body;
      await pool.query("INSERT INTO categories (name) VALUES ($1)", [name]);
      res.json({ ok: true });
    } else if (req.method === "DELETE") {
      const { id } = req.body;
      await pool.query("DELETE FROM categories WHERE id=$1", [id]);
      res.json({ ok: true });
    } else {
      res.status(405).end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro em categorias" });
  }
}
