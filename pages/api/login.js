import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { username, password } = req.body;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  const user = data[0];

  if (user.password_hash !== password) {
    return res.status(401).json({ error: 'Senha inválida' });
  }

  return res.status(200).json({
    ok: true,
    user
  });
}
