export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Usuário e senha obrigatórios"
    });
  }

  // TESTE (depois você troca por banco)
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
