import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const result = await pool.query(
        "SELECT t.id, t.title, t.content, c.name as category, t.created_at FROM topics t LEFT JOIN categories c ON t.category_id=c.id ORDER BY t.created_at DESC"
      );
      res.json(result.rows);
    } else if (req.method === "POST") {
      const { title, content, category_id } = req.body;
      await pool.query(
        "INSERT INTO topics (title, content, category_id) VALUES ($1, $2, $3)",
        [title, content, category_id]
      );
      res.json({ ok: true });
    } else {
      res.status(405).end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro em tópicos" });
  }
}
