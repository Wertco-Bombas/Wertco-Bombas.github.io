import { compare } from "bcryptjs";
import { Pool } from "pg";

// Cria a conexão com o banco Postgres usando a variável de ambiente
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  // Só aceita requisições POST
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;

  try {
    // Busca o usuário no banco
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Usuário inválido" });

    // Confere a senha com bcrypt
    const ok = await compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Senha inválida" });

    // Retorna dados básicos do usuário (sem expor hash da senha)
    res.json({ ok: true, user: { username: user.username, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
}
