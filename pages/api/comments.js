import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { topic_id } = req.query;
      const result = await pool.query(
        "SELECT c.id, c.text, c.status, u.username as author, c.created_at FROM comments c JOIN users u ON c.author_id=u.id WHERE c.topic_id=$1 ORDER BY c.created_at",
        [topic_id]
      );
      res.json(result.rows);
    } else if (req.method === "POST") {
      const { topic_id, author_id, text } = req.body;
      await pool.query(
        "INSERT INTO comments (topic_id, author_id, text, status) VALUES ($1, $2, $3, $4)",
        [topic_id, author_id, text, "pending"]
      );
      res.json({ ok: true });
    } else if (req.method === "PUT") {
      const { id, status } = req.body;
      await pool.query("UPDATE comments SET status=$1 WHERE id=$2", [status, id]);
      res.json({ ok: true });
    } else {
      res.status(405).end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro em comentários" });
  }
}
