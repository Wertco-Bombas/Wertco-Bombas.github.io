export default function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  // TESTE SIMPLES (depois você conecta no Supabase)
  if (username === "admin" && password === "123") {
    return res.status(200).json({
      ok: true,
      user: {
        username: "admin",
        role: "admin"
      }
    });
  }

  return res.status(401).json({
    error: "Usuário ou senha inválidos"
  });
}
