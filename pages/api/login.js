import bcrypt from 'bcryptjs';
// ...
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('username', username)
  .single();

if (!data || !(await bcrypt.compare(password, data.password_hash))) {
  return res.status(401).json({ error: 'Usuário ou senha inválidos' });
}
