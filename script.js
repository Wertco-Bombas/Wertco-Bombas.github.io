/* Don — script.js
   Updated: search/actions visible only on KB page; buttons wired and functional.
*/

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

/* Seed / persistence */
let users = JSON.parse(localStorage.getItem(KEY_USERS) || "null") || [
  { username: "admin", password: "admin", name: "Administrador", role: "Admin" },
  { username: "supervisor", password: "supervisor", name: "Supervisor Exemplo", role: "Supervisor" },
  { username: "user", password: "user", name: "Usuário Comum", role: "User" }
];
localStorage.setItem(KEY_USERS, JSON.stringify(users));

let categories = JSON.parse(localStorage.getItem(KEY_CATS) || "null") || ["HTML","CSS","JavaScript"];
localStorage.setItem(KEY_CATS, JSON.stringify(categories));

let topics = JSON.parse(localStorage.getItem(KEY_TOPICS) || "null") || [
  { id: idGen(), title: "HTML Básico", content: "Estrutura de páginas web.", category: "HTML", media: [], comments: [
      { id: idGen(), author: "user", authorName: "Usuário Comum", text: "Comentário pendente", media: [], ts: new Date("2026-05-04T17:54:51").getTime(), status: "pending" }
    ] },
  { id: idGen(), title: "CSS Avançado", content: "Estilização e responsividade.", category: "CSS", media: [], comments: [] }
];
localStorage.setItem(KEY_TOPICS, JSON.stringify(topics));

if(!localStorage.getItem(KEY_AUDIT)) localStorage.setItem(KEY_AUDIT, JSON.stringify([]));
if(!localStorage.getItem(KEY_TRAIN)) localStorage.setItem(KEY_TRAIN, JSON.stringify([]));

function persistTopics(){ localStorage.setItem(KEY_TOPICS, JSON.stringify(topics)); }
function persistCats(){ localStorage.setItem(KEY_CATS, JSON.stringify(categories)); }
function persistUsers(){ localStorage.setItem(KEY_USERS, JSON.stringify(users)); }
function persistAudit(msg){ const arr = JSON.parse(localStorage.getItem(KEY_AUDIT) || "[]"); arr.unshift(`${new Date().toLocaleString()} — ${msg}`); localStorage.setItem(KEY_AUDIT, JSON.stringify(arr.slice(0,500))); }
function persistTrainingFiles(arr){ localStorage.setItem(KEY_TRAIN, JSON.stringify(arr)); }

function getSession(){ return JSON.parse(localStorage.getItem(KEY_SESSION) || "null"); }
function setSession(s){ localStorage.setItem(KEY_SESSION, JSON.stringify(s)); }
function clearSession(){ localStorage.removeItem(KEY_SESSION); }

/* UI helpers */
function showLogin(){ $("loginScreen").style.display = "block"; $("dashboard").style.display = "none"; $("headerUser").style.display = "none"; }
function showDashboard(){ $("loginScreen").style.display = "none"; $("dashboard").style.display = "block"; $("headerUser").style.display = "flex"; updateHeader(); configureAccess(); showSection('page-kb'); renderAll(); checkPendingForSupervisor(); }

function updateHeader(){
  const s = getSession();
  if(!s){ $("headerUser").style.display = "none"; return; }
  $("headerUser").style.display = "flex";
  $("headerName").textContent = s.name || s.username;
  $("headerRole").textContent = `(${s.role})`;
}

/* Navigation */
function showSection(id){
  document.querySelectorAll('.page').forEach(p=>{ p.classList.remove('active'); p.style.display = 'none'; });
  const el = $(id);
  if(el){ el.classList.add('active'); el.style.display = 'block'; }
  // kbSearchBar is inside page-kb, so no global show/hide needed.
  if(id === 'page-audit') renderAudit();
  if(id === 'page-training') renderTraining();
  if(id === 'page-user') renderUsers();
  if(id === 'page-kb') {
    updateCategorySelects();
    renderTopics();
  }
}

/* Access control */
function normRole(r){ return (r||"").toString().trim().toLowerCase(); }
function configureAccess(){
  const s = getSession(); const role = s ? normRole(s.role) : "";
  document.querySelectorAll('.top-menu .menu-item').forEach(item=>{
    const target = item.getAttribute('data-target');
    if(target === 'page-user' || target === 'page-audit'){
      if(role === "admin" || role === "supervisor"){ item.classList.remove('disabled'); item.removeAttribute('aria-disabled'); }
      else { item.classList.add('disabled'); item.setAttribute('aria-disabled','true'); }
    }
  });
  const canManage = (role === "admin" || role === "supervisor");
  if($("btnNewTopic")) $("btnNewTopic").style.display = canManage ? 'inline-flex' : 'none';
  if($("btnNewCategory")) $("btnNewCategory").style.display = canManage ? 'inline-flex' : 'none';
  if($("btnDeleteCategoryTop")) $("btnDeleteCategoryTop").style.display = canManage ? 'inline-flex' : 'none';
  populateNewUserRoleOptions(role === "admin");
}

function populateNewUserRoleOptions(isAdmin){
  const sel = $("newRole"); if(!sel) return;
  sel.innerHTML = "";
  if(isAdmin){ ["Admin","Supervisor","User"].forEach(r=> sel.insertAdjacentHTML('beforeend', `<option value="${r}">${r}</option>`)); }
  else { sel.insertAdjacentHTML('beforeend', `<option value="User">User</option>`); sel.value = "User"; }
}

/* Categories */
function updateCategorySelects(){
  categories = Array.from(new Set(categories.filter(Boolean)));
  persistCats();
  const filter = $("filterCategory"), topicCat = $("topicCategory"), deleteSel = $("deleteCategorySelect");
  [filter, topicCat, deleteSel].forEach(s=>{ if(!s) return; s.innerHTML = `<option value="">Todas as categorias</option>`; categories.forEach(c=> s.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)); });
}

/* Render topics */
function renderTopics(){
  const q = ($("searchAll") ? $("searchAll").value.trim().toLowerCase() : "");
  const cat = ($("filterCategory") ? $("filterCategory").value : "");
  const container = $("topicsList"); container.innerHTML = "";
  const filtered = topics.filter(t=>{
    const matchCat = !cat || t.category === cat;
    if(!q) return matchCat;
    const inTitle = (t.title||"").toLowerCase().includes(q);
    const inContent = (t.content||"").toLowerCase().includes(q);
    const inCategory = (t.category||"").toLowerCase().includes(q);
    const commentsText = (t.comments||[]).map(c => (c.text||"")).join(" ").toLowerCase();
    return matchCat && (inTitle || inContent || inCategory || commentsText.includes(q));
  });

  if(filtered.length === 0){ container.innerHTML = `<div class="topic"><div class="small">Nenhum tópico encontrado.</div></div>`; return; }

  filtered.forEach(t=>{
    const article = document.createElement('article');
    article.className = 'topic';
    article.id = `topic-${t.id}`;
    const catHtml = t.category ? `<div class="badge">${escapeHtml(t.category)}</div>` : `<div class="small">Sem categoria</div>`;
    const commentsHtml = (t.comments||[]).map(c=>{
      const statusClass = c.status === "pending" ? "status-pending" : (c.status === "approved" ? "status-approved" : "status-rejected");
      const statusLabel = c.status === "pending" ? "Pendente" : (c.status === "approved" ? "Aprovado" : "Rejeitado");
      const author = escapeHtml(c.authorName || c.author);
      const commentId = c.id;
      const sess = getSession(); const role = sess ? normRole(sess.role) : "";
      let actions = "";
      if(sess && (role === "admin" || role === "supervisor") && c.status === "pending"){
        actions += `<button class="btn" data-action="approve-comment" data-topic="${t.id}" data-cid="${commentId}">Aprovar</button>`;
        actions += `<button class="btn warn" data-action="reject-comment" data-topic="${t.id}" data-cid="${commentId}">Rejeitar</button>`;
      }
      return `<div id="comment-${commentId}" class="comment-block"><div class="comment-meta"><strong class="small">${author}</strong><div class="small">${new Date(c.ts).toLocaleString()}</div><div class="status-pill ${statusClass}">${statusLabel}</div></div><div style="margin-top:6px">${escapeHtml(c.text)}</div><div style="margin-top:8px">${actions}</div></div>`;
    }).join("");

    article.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="flex:1">
          <h3>${escapeHtml(t.title)}</h3>
          <div class="small" style="margin-top:6px">${escapeHtml(t.content)}</div>
        </div>
        <div>${catHtml}</div>
      </div>
      ${commentsHtml || `<div class="small" style="margin-top:10px">Sem comentários</div>`}
      <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
        <input type="text" placeholder="Adicionar comentário" id="comment-text-${t.id}" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:var(--text)">
        <button class="btn" data-action="send-comment" data-id="${t.id}">Enviar</button>
      </div>
    `;
    container.appendChild(article);
  });

  attachCommentActionHandlers();
}

/* Comment actions */
function attachCommentActionHandlers(){
  document.querySelectorAll('button[data-action="send-comment"]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-id');
      const textEl = $(`comment-text-${id}`);
      const text = textEl.value.trim();
      if(!text) return alert("Digite um comentário.");
      const sess = getSession(); if(!sess) return alert("Faça login para comentar.");
      const role = normRole(sess.role);
      const status = (role === "user") ? "pending" : "approved";
      const comment = { id: idGen(), author: sess.username, authorName: sess.name, text, media: [], ts: Date.now(), status };
      const topic = topics.find(t=> t.id === id);
      if(!topic) return alert("Tópico não encontrado.");
      topic.comments = topic.comments || [];
      topic.comments.push(comment);
      persistTopics();
      persistAudit(`Comentário "${comment.id}" no tópico "${topic.title}" por ${sess.username} (status: ${status})`);
      if(status === "pending") notifySupervisorsPending();
      textEl.value = "";
      renderTopics();
    };
  });

  document.querySelectorAll('button[data-action="approve-comment"]').forEach(btn=>{
    btn.onclick = ()=>{
      const topicId = btn.getAttribute('data-topic'); const cid = btn.getAttribute('data-cid');
      const sess = getSession(); if(!sess) return alert("Faça login.");
      const role = normRole(sess.role); if(role !== "admin" && role !== "supervisor") return alert("Acesso negado.");
      const topic = topics.find(t=> t.id === topicId); if(!topic) return;
      const comment = topic.comments.find(c=> c.id === cid); if(!comment) return;
      comment.status = "approved"; comment.approvedBy = sess.username; comment.approvedAt = Date.now();
      persistTopics(); persistAudit(`Comentário "${cid}" aprovado por ${sess.username}`); renderTopics(); renderAudit();
    };
  });

  document.querySelectorAll('button[data-action="reject-comment"]').forEach(btn=>{
    btn.onclick = ()=>{
      const topicId = btn.getAttribute('data-topic'); const cid = btn.getAttribute('data-cid');
      const sess = getSession(); if(!sess) return alert("Faça login.");
      const role = normRole(sess.role); if(role !== "admin" && role !== "supervisor") return alert("Acesso negado.");
      const topic = topics.find(t=> t.id === topicId); if(!topic) return;
      const comment = topic.comments.find(c=> c.id === cid); if(!comment) return;
      const reason = prompt("Motivo da rejeição (opcional):", "");
      comment.status = "rejected"; comment.rejectedBy = sess.username; comment.rejectedAt = Date.now(); comment.rejectionReason = reason || "";
      persistTopics(); persistAudit(`Comentário "${cid}" rejeitado por ${sess.username} (${reason || "sem motivo"})`); renderTopics(); renderAudit();
    };
  });
}

/* Pending notifications */
function getPendingComments(){
  const arr = [];
  topics.forEach(t=>{
    (t.comments||[]).forEach(c=>{
      if(c.status === "pending") arr.push({ topicId: t.id, topicTitle: t.title, commentId: c.id, author: c.author, ts: c.ts });
    });
  });
  return arr;
}

function updatePendingPanel(){
  const pending = getPendingComments();
  const panel = $("pendingPanel");
  const list = $("pendingList");
  if(pending.length === 0){ panel.style.display = 'none'; list.innerHTML = ''; return; }
  panel.style.display = 'block';
  list.innerHTML = '';
  pending.forEach(p=>{
    const el = document.createElement('div'); el.className = 'pending-item';
    el.innerHTML = `<div class="small"><strong>${escapeHtml(p.topicTitle)}</strong><div style="margin-top:4px">Comentário ${escapeHtml(p.commentId)} por ${escapeHtml(p.author)}</div></div><div class="goto"><button class="btn visit" data-topic="${p.topicId}" data-cid="${p.commentId}">Ir</button></div>`;
    list.appendChild(el);
  });
  list.querySelectorAll('button[data-topic]').forEach(b=>{
    b.onclick = ()=> {
      const tid = b.getAttribute('data-topic'); const cid = b.getAttribute('data-cid');
      showSection('page-kb'); renderTopics();
      setTimeout(()=> {
        const el = document.getElementById(`comment-${cid}`);
        if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('highlight'); setTimeout(()=> el.classList.remove('highlight'), 2500); }
      }, 200);
    };
  });
  $("btnClosePending").onclick = ()=> { panel.style.display = 'none'; };
}

function notifySupervisorsPending(){
  const sess = getSession(); if(!sess) return;
  const role = normRole(sess.role);
  if(role === "admin" || role === "supervisor"){
    showCentralPendingPopup();
  } else {
    updatePendingPanel();
  }
}

function showCentralPendingPopup(){
  const pending = getPendingComments();
  if(pending.length === 0) return;
  const container = $("popupContainer"); container.innerHTML = "";
  const overlay = document.createElement('div'); overlay.className = 'popup-overlay';
  const box = document.createElement('div'); box.className = 'popup-box';
  box.innerHTML = `<h3>Existem ${pending.length} comentários pendentes</h3><div id="centralPendingList" style="margin-top:10px"></div><div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end"><button class="btn ghost" id="centralClose">Fechar</button></div>`;
  overlay.appendChild(box); container.appendChild(overlay);
  const list = box.querySelector('#centralPendingList');
  pending.slice(0,8).forEach(p=>{
    const item = document.createElement('div'); item.style.marginTop='8px';
    item.innerHTML = `<div class="small"><strong>${escapeHtml(p.topicTitle)}</strong> — comentário ${escapeHtml(p.commentId)} por ${escapeHtml(p.author)}</div><div style="margin-top:6px;display:flex;gap:8px;justify-content:flex-end"><button class="btn visit" data-action="goto-pending" data-topic="${p.topicId}" data-cid="${p.commentId}">Ir</button></div>`;
    list.appendChild(item);
  });
  box.querySelectorAll('button[data-action="goto-pending"]').forEach(b=>{
    b.onclick = ()=> {
      const tid = b.getAttribute('data-topic'); const cid = b.getAttribute('data-cid');
      closeCentralPopup();
      showSection('page-kb'); renderTopics();
      setTimeout(()=> {
        const el = document.getElementById(`comment-${cid}`);
        if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('highlight'); setTimeout(()=> el.classList.remove('highlight'), 3000); }
      }, 200);
    };
  });
  $("centralClose").onclick = ()=> closeCentralPopup();
}

function closeCentralPopup(){ $("popupContainer").innerHTML = ""; }

/* Training */
function renderTraining(){
  const sess = getSession();
  const up = $("trainingUpload");
  const stored = JSON.parse(localStorage.getItem(KEY_TRAIN) || "[]");
  $("trainingFiles").innerHTML = stored.map(f=> `<div class="small">${escapeHtml(f)}</div>`).join("");
  if(!sess){ up.innerHTML = `<div class="small">Faça login para acessar o treinamento.</div>`; return; }
  const role = normRole(sess.role);
  if(role === "admin" || role === "supervisor"){
    up.innerHTML = `<input type="file" id="trainFile" multiple accept=".pdf,.doc,.docx,video/*"><div style="margin-top:8px"><button class="btn" id="btnUploadTrain">Enviar</button></div>`;
    $("btnUploadTrain").onclick = ()=> {
      const input = $("trainFile");
      const files = Array.from(input.files || []);
      const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const storedFiles = JSON.parse(localStorage.getItem(KEY_TRAIN) || "[]");
      files.forEach(f=>{
        if(f.type.startsWith('video/') || allowed.includes(f.type) || f.name.match(/\.(pdf|doc|docx)$/i)){
          storedFiles.push(f.name);
        } else {
          alert(`Arquivo "${f.name}" não é permitido e foi ignorado.`);
        }
      });
      localStorage.setItem(KEY_TRAIN, JSON.stringify(storedFiles));
      renderTraining();
      persistAudit(`Arquivos de treinamento enviados por ${sess.username}`);
    };
  } else {
    up.innerHTML = `<div class="small">Somente Supervisor/Admin podem enviar arquivos.</div>`;
  }
}

/* Users management */
function renderUsers(){
  const container = $("usersList"); container.innerHTML = "";
  users = JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
  users.forEach(u=>{
    const el = document.createElement('div'); el.className = 'user-item';
    el.innerHTML = `<div><strong style="color:var(--accent)">${escapeHtml(u.name)}</strong><div class="small">${escapeHtml(u.username)} — ${escapeHtml(u.role)}</div></div><div class="controls"><button class="btn ghost" data-action="edit-name" data-user="${escapeHtml(u.username)}">Editar</button><button class="btn ghost" data-action="change-pass" data-user="${escapeHtml(u.username)}">Alterar senha</button><button class="btn warn" data-action="delete-user" data-user="${escapeHtml(u.username)}">Excluir</button></div>`;
    container.appendChild(el);
  });
  container.querySelectorAll('button[data-action="edit-name"]').forEach(b=> b.onclick = ()=> editUserName(b.getAttribute('data-user')));
  container.querySelectorAll('button[data-action="change-pass"]').forEach(b=> b.onclick = ()=> changeUserPassword(b.getAttribute('data-user')));
  container.querySelectorAll('button[data-action="delete-user"]').forEach(b=> b.onclick = ()=> deleteUser(b.getAttribute('data-user')));
}

function editUserName(username){
  const s = getSession(); if(!s) return alert("Faça login.");
  const roleCurrent = normRole(s.role); if(roleCurrent !== "admin" && roleCurrent !== "supervisor") return alert("Acesso negado.");
  users = JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
  const u = users.find(x=> x.username === username); if(!u) return alert("Usuário não encontrado.");
  const newName = prompt("Novo nome:", u.name); if(!newName) return;
  u.name = newName; persistUsers(); persistAudit(`Nome do usuário ${username} alterado para "${newName}" por ${s.username}`); renderUsers(); alert("Nome atualizado.");
}

function changeUserPassword(username){
  const s = getSession(); if(!s) return alert("Faça login.");
  const roleCurrent = normRole(s.role); if(roleCurrent !== "admin" && roleCurrent !== "supervisor") return alert("Acesso negado.");
  users = JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
  const u = users.find(x=> x.username === username); if(!u) return alert("Usuário não encontrado.");
  if(roleCurrent === "supervisor" && normRole(u.role) === "admin") return alert("Supervisor não pode alterar senha do Admin.");
  const newPass = prompt(`Digite a nova senha para "${username}":`); if(!newPass) return alert("Operação cancelada.");
  u.password = newPass; persistUsers(); persistAudit(`Senha de ${username} alterada por ${s.username}`); alert("Senha alterada.");
}

function deleteUser(username){
  const s = getSession(); if(!s) return alert("Faça login.");
  const roleCurrent = normRole(s.role); if(roleCurrent !== "admin" && roleCurrent !== "supervisor") return alert("Acesso negado.");
  users = JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
  const target = users.find(u=> u.username === username); if(!target) return alert("Usuário não encontrado.");
  if(normRole(target.role) === "admin"){
    if(roleCurrent === "supervisor") return alert("Supervisor não pode excluir usuário Admin.");
    const otherAdmins = users.filter(u=> u.username !== username && normRole(u.role) === "admin").length;
    if(otherAdmins === 0){
      const confirmText = prompt("Você está prestes a excluir o último Admin. Para confirmar, digite CONFIRMAR (maiúsculo).");
      if(confirmText !== "CONFIRMAR"){ alert("Operação cancelada."); return; }
    } else {
      if(!confirm(`Excluir o usuário Admin "${username}"? Esta ação é irreversível.`)) return;
    }
  } else {
    if(!confirm(`Deseja excluir o usuário "${username}"?`)) return;
  }
  users = users.filter(u=> u.username !== username); persistUsers(); persistAudit(`Usuário "${username}" excluído por ${s.username}`); renderUsers(); alert(`Usuário "${username}" excluído.`);
}

/* Audit */
function renderAudit(){
  const panel = $("auditLog");
  const sess = getSession();
  const role = sess ? normRole(sess.role) : "";
  const logs = JSON.parse(localStorage.getItem(KEY_AUDIT) || "[]");
  const pending = getPendingComments();
  let html = "";

  if(role === "supervisor"){
    html += `<div style="margin-bottom:8px"><strong class="small">Pendências de aprovação</strong></div>`;
    if(pending.length === 0) html += `<div class="small">Sem pendências.</div>`;
    else {
      pending.forEach(p=>{
        html += `<div class="audit-item"><div class="info small"><strong>${escapeHtml(p.topicTitle)}</strong><div style="margin-top:4px">Comentário ${escapeHtml(p.commentId)} por ${escapeHtml(p.author)}</div></div><div class="goto"><button class="btn visit" data-action="audit-goto" data-topic="${p.topicId}" data-cid="${p.commentId}">Ir</button></div></div>`;
      });
    }
    panel.innerHTML = html;
  } else {
    if(pending.length > 0){
      html += `<div style="margin-bottom:8px"><strong class="small">Pendências de aprovação</strong></div>`;
      pending.forEach(p=>{
        html += `<div class="audit-item"><div class="info small"><strong>${escapeHtml(p.topicTitle)}</strong><div style="margin-top:4px">Comentário ${escapeHtml(p.commentId)} por ${escapeHtml(p.author)}</div></div><div class="goto"><button class="btn visit" data-action="audit-goto" data-topic="${p.topicId}" data-cid="${p.commentId}">Ir</button></div></div>`;
      });
      html += `<hr style="border-color:rgba(255,255,255,0.04);margin:8px 0">`;
    }
    if(!logs || logs.length === 0) html += `<div class="small">Sem registros.</div>`; else html += logs.map(l=> `<div class="small" style="margin-bottom:6px">${escapeHtml(l)}</div>`).join('');
    panel.innerHTML = html;
  }

  panel.querySelectorAll('button[data-action="audit-goto"]').forEach(b=>{
    b.onclick = ()=> {
      const tid = b.getAttribute('data-topic'); const cid = b.getAttribute('data-cid');
      showSection('page-kb'); renderTopics();
      setTimeout(()=> {
        const el = document.getElementById(`comment-${cid}`);
        if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('highlight'); setTimeout(()=> el.classList.remove('highlight'), 3000); }
      }, 200);
    };
  });
}

/* Login logic with Enter key support */
function doLogin(){
  const u = $("loginUser").value.trim();
  const p = $("loginPass").value;
  if(!u || !p) return alert("Preencha usuário e senha.");
  users = JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
  const found = users.find(x=> x.username === u && x.password === p);
  if(!found) return alert("Usuário ou senha inválidos");
  setSession({ username: found.username, name: found.name, role: found.role, ts: Date.now() });
  showDashboard();
}

function doLogout(){
  clearSession();
  showLogin();
}

/* Init and event wiring */
document.addEventListener('DOMContentLoaded', ()=>{
  // Login handlers
  if($("btnLogin")) $("btnLogin").addEventListener('click', doLogin);
  if($("btnLogout")) $("btnLogout").addEventListener('click', doLogout);

  // Enter key on inputs
  ["loginUser","loginPass"].forEach(id=>{
    const el = $(id);
    if(!el) return;
    el.addEventListener('keydown', (e)=>{
      if(e.key === "Enter") doLogin();
    });
  });

  // Menu navigation (delegated)
  document.querySelectorAll('.top-menu .menu-item').forEach(item=>{
    item.addEventListener('click', ()=>{
      if(item.classList.contains('disabled')) return;
      const target = item.getAttribute('data-target');
      if(target) showSection(target);
    });
  });

  // Search/filter (only active when KB visible)
  if($("searchAll")) $("searchAll").addEventListener('input', renderTopics);
  if($("filterCategory")) $("filterCategory").addEventListener('change', renderTopics);

  // KB action buttons (wired explicitly)
  if($("btnNewTopic")) $("btnNewTopic").addEventListener('click', ()=>{
    const s = getSession(); if(!s) return alert("Faça login.");
    const r = normRole(s.role); if(r !== "admin" && r !== "supervisor") return alert("Acesso negado.");
    const title = prompt("Título do tópico:"); if(!title) return;
    const content = prompt("Descrição do tópico:") || "";
    const category = prompt("Categoria (ex: HTML, CSS):") || "";
    const status = (r === "user") ? "pending" : "approved";
    const t = { id: idGen(), title, content, category, media: [], comments: [], status };
    topics.push(t); persistTopics(); persistAudit(`Tópico "${title}" criado por ${s.username} (status: ${status})`);
    if(status === "pending") notifySupervisorsPending();
    showSection('page-kb'); renderTopics();
  });

  if($("btnNewCategory")) $("btnNewCategory").addEventListener('click', ()=>{
    const s = getSession(); if(!s) return alert("Faça login.");
    const r = normRole(s.role); if(r !== "admin" && r !== "supervisor") return alert("Acesso negado.");
    const name = prompt("Nome da nova categoria:"); if(!name) return;
    if(categories.includes(name)) return alert("Categoria já existe.");
    categories.push(name); persistCats(); persistAudit(`Categoria "${name}" criada por ${s.username}`); updateCategorySelects(); alert("Categoria criada.");
  });

  if($("btnDeleteCategoryTop")) $("btnDeleteCategoryTop").addEventListener('click', ()=>{
    const s = getSession(); if(!s) return alert("Faça login.");
    const r = normRole(s.role); if(r !== "admin" && r !== "supervisor") return alert("Acesso negado.");
    const name = prompt("Nome da categoria a excluir:"); if(!name) return;
    if(!categories.includes(name)) return alert("Categoria não encontrada.");
    const usedBy = topics.filter(t=> t.category === name).length;
    if(!confirm(`Excluir categoria "${name}"? ${usedBy} tópico(s) usam essa categoria.`)) return;
    categories = categories.filter(c=> c !== name); topics = topics.map(t=> t.category === name ? ({ ...t, category: "" }) : t);
    persistCats(); persistTopics(); persistAudit(`Categoria "${name}" excluída por ${s.username}`); updateCategorySelects(); renderTopics();
  });

  // User creation
  if($("btnCreateUser")) $("btnCreateUser").addEventListener('click', ()=>{
    const s = getSession(); if(!s) return alert("Faça login.");
    const roleCurrent = normRole(s.role); if(roleCurrent !== "admin" && roleCurrent !== "supervisor") return alert("Acesso negado.");
    const name = $("newName").value.trim(); const username = $("newLogin").value.trim(); const pass = $("newPass").value; let role = $("newRole").value || "User";
    if(!name || !username || !pass) return alert("Preencha nome, usuário e senha.");
    users = JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
    if(users.some(u=> u.username === username)) return alert("Usuário já existe.");
    if(roleCurrent === "supervisor") role = "User";
    users.push({ username, password: pass, name, role }); persistUsers(); persistAudit(`Usuário "${username}" criado por ${s.username} com papel ${role}`);
    $("newName").value = ""; $("newLogin").value = ""; $("newPass").value = ""; renderUsers(); alert(`Usuário "${username}" criado.`);
  });

  // Initial render
  updateCategorySelects();
  const sess = getSession();
  if(sess) showDashboard(); else showLogin();
  renderAll();
});

/* Utility renderers */
function renderAll(){ updateCategorySelects(); renderTopics(); renderUsers(); renderAudit(); renderTraining(); updatePendingPanel(); }
function checkPendingForSupervisor(){ const sess = getSession(); if(!sess) return; const role = normRole(sess.role); if(role === "admin" || role === "supervisor"){ const pending = getPendingComments(); if(pending.length > 0) showCentralPendingPopup(); } else updatePendingPanel(); }
