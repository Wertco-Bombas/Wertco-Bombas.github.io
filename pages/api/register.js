import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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
    const hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password_hash: hash }]);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ ok: true, user: data });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
