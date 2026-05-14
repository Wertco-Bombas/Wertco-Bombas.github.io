// pages/api/login.js
import { createClient } from '@supabase/supabase-js';

// Cria o cliente Supabase usando variáveis de ambiente
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { username, password } = req.body;

  try {
    // Busca o usuário na tabela "users"
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    return res.status(200).json({ ok: true, user: data });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
