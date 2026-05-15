/* =========================
   DON - SCRIPT LIMPO (LOGIN FUNCIONANDO)
========================= */

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
  const login = $("loginScreen");
  const dash = $("dashboard");
  const header = $("headerUser");

  if(login) login.style.display = "block";
  if(dash) dash.style.display = "none";
  if(header) header.style.display = "none";
}

function showDashboard(){
  const login = $("loginScreen");
  const dash = $("dashboard");
  const header = $("headerUser");

  if(login) login.style.display = "none";
  if(dash) dash.style.display = "block";
  if(header) header.style.display = "flex";
}

/* =========================
   LOGIN COM SUPABASE
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
      body: JSON.stringify({
        username: u,
        password: p
      })
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
    console.error(err);
    alert("Erro ao conectar com servidor.");
  }
}

/* LOGOUT */
function doLogout(){
  clearSession();
  showLogin();
}

/* =========================
   INIT SEGURO (SEM QUEBRAR)
========================= */
window.addEventListener('DOMContentLoaded', () => {

  const btn = $("btnLogin");
  const btnOut = $("btnLogout");

  if(btn) btn.addEventListener('click', doLogin);
  if(btnOut) btnOut.addEventListener('click', doLogout);

  const u = $("loginUser");
  const p = $("loginPass");

  function enter(e){
    if(e.key === "Enter") doLogin();
  }

  if(u) u.addEventListener('keydown', enter);
  if(p) p.addEventListener('keydown', enter);

  const sess = getSession();
  if(sess) showDashboard();
  else showLogin();

  console.log("LOGIN SYSTEM OK");
});
