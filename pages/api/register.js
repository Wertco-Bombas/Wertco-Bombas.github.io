// pages/api/register.js
import { createClient } from '@supabase/supabase-js';

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
    // Insere novo usuário na tabela "users"
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password }]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, user: data });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
