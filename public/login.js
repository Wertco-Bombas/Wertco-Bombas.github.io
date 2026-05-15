export default function Login() {
  async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert('Login feito com sucesso!');
    console.log(data);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <input id="loginUser" placeholder="Usuário" />
        <br /><br />

        <input id="loginPass" type="password" placeholder="Senha" />
        <br /><br />

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
