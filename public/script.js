/* Don — script.js (LOGIN CORRIGIDO COM SUPABASE) */

/* Storage keys */
const KEY_TOPICS = "don_topics_full";
const KEY_CATS = "don_categories_full";
const KEY_USERS = "don_users_full";
const KEY_AUDIT = "don_audit_full";
const KEY_TRAIN = "don_training_files";
const KEY_SESSION = "don_session_full";

/* Utilities */
function idGen(){ return 'id_' + Math.random().toString(36).slice(2,9); }
function $(id){ return document.getElementById(id); }
function escapeHtml(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }

/* Storage */
function getSession(){ return JSON.parse(localStorage.getItem(KEY_SESSION) || "null"); }
function setSession(s){ localStorage.setItem(KEY_SESSION, JSON.stringify(s)); }
function clearSession(){ localStorage.removeItem(KEY_SESSION); }

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
   🔥 LOGIN CORRIGIDO
========================= */
async function doLogin(){
  const u = $("loginUser").value.trim();
  const p = $("loginPass").value;

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

    // salva sessão
    setSession({
      username: data.user.username,
      name: data.user.username,
      role: data.user.role,
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

/* INIT */
document.addEventListener('DOMContentLoaded', ()=>{
  $("btnLogin").addEventListener('click', doLogin);
  $("btnLogout").addEventListener('click', doLogout);

  // Enter login
  ["loginUser","loginPass"].forEach(id=>{
    const el = $(id);
    if(el){
      el.addEventListener('keydown', (e)=>{
        if(e.key === "Enter") doLogin();
      });
    }
  });

  // sessão inicial
  const sess = getSession();
  if(sess) showDashboard();
  else showLogin();
});
