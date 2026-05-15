export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { username, password } = req.body;

  // LOGIN MOCK (teste)
  if (username === "admin" && password === "admin") {
    return res.status(200).json({
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
