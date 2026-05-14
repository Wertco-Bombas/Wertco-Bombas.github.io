import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const result = await pool.query("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100");
      res.json(result.rows);
    } else if (req.method === "POST") {
      const { message } = req.body;
      await pool.query("INSERT INTO audit_log (message) VALUES ($1)", [message]);
      res.json({ ok: true });
    } else {
      res.status(405).end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro em auditoria" });
  }
}
