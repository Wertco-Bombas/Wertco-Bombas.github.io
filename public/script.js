function $(id){
  return document.getElementById(id);
}

/* SESSION */
const KEY_SESSION = "don_session_full";

function setSession(s){
  localStorage.setItem(KEY_SESSION, JSON.stringify(s));
}

function getSession(){
  return JSON.parse(localStorage.getItem(KEY_SESSION) || "null");
}

function clearSession(){
  localStorage.removeItem(KEY_SESSION);
}

/* UI */
function showLogin(){
  $("loginScreen").style.display = "block";
  $("dashboard").style.display = "none";
  $("headerUser").style.display = "none";
}

function showDashboard(){
  $("loginScreen").style.display = "none";
  $("dashboard").style.display = "block";
  $("headerUser").style.display = "flex";
}

/* =========================
   LOGIN (ROBUSTO)
========================= */
async function doLogin(){

  const u = $("loginUser")?.value?.trim();
  const p = $("loginPass")?.value;

  if(!u || !p){
    alert("Preencha usuário e senha.");
    return;
  }

  try {

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: u, password: p })
    });

    const data = await res.json();

    if(!res.ok){
      alert(data.error || "Usuário ou senha inválidos");
      return;
    }

    setSession({
      username: data.user.username,
      role: data.user.role,
      name: data.user.username,
      ts: Date.now()
    });

    showDashboard();

  } catch (err) {
    console.error("Erro login:", err);
    alert("Erro de conexão com servidor");
  }
}

/* LOGOUT */
function doLogout(){
  clearSession();
  showLogin();
}

/* =========================
   INIT SEGURO
========================= */
window.addEventListener('DOMContentLoaded', () => {

  const btn = $("btnLogin");
  const logout = $("btnLogout");

  if(btn) btn.addEventListener('click', doLogin);
  if(logout) logout.addEventListener('click', doLogout);

  ["loginUser","loginPass"].forEach(id=>{
    const el = $(id);
    if(el){
      el.addEventListener('keydown', (e)=>{
        if(e.key === "Enter") doLogin();
      });
    }
  });

  const sess = getSession();
  if(sess) showDashboard();
  else showLogin();

  console.log("LOGIN OK - SISTEMA CARREGADO");
});
