/* Don — script.js
   Versão final: login funcional + Enter para logar + dashboard com aprovação básica
   Salva dados principais em localStorage (protótipo local)
*/

/* Storage keys */
const KEY_TOPICS = "don_topics_full_v1";
const KEY_CATS = "don_categories_full_v1";
const KEY_USERS = "don_users_full_v1";
const KEY_AUDIT = "don_audit_full_v1";
const KEY_TRAIN = "don_training_files_v1";
const KEY_SESSION = "don_session_full_v1";

/* Helpers */
const $ = id => document.getElementById(id);
const idGen = () => 'id_' + Math.random().toString(36).slice(2,9);
const escapeHtml = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");

function persist(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function load(key, fallback){ try{ const v = JSON.parse(localStorage.getItem(key)); return v === null ? fallback : (v || fallback); } catch(e){ return fallback; } }

/* Seed data */
let users = load(KEY_USERS, [
  { username: "admin", password: "admin", name: "Administrador", role: "Admin" },
  { username: "supervisor", password: "supervisor", name: "Supervisor Exemplo", role: "Supervisor" },
  { username: "user", password: "user", name: "Usuário Comum", role: "User" }
]);

let categories = load(KEY_CATS, ["HTML","CSS","JavaScript"]);

let topics = load(KEY_TOPICS, [
  { id: idGen(), title: "HTML Básico", content: "Estrutura de páginas web.", category: "HTML", media: [], comments: [
    { id: idGen(), author: "user", authorName: "Usuário Comum", text: "Comentário pendente", media: [], ts: new Date("2026-05-04T17:54:51").getTime(), status: "pending" }
  ] },
  { id: idGen(), title: "CSS Avançado", content: "Estilização e responsividade.", category: "CSS", media: [], comments: [] }
]);

let audit = load(KEY_AUDIT, []);
let trainingFiles = load(KEY_TRAIN, []);
let session = load(KEY_SESSION, null);

/* Save initial seeds if missing */
persist(KEY_USERS, users);
persist(KEY_CATS, categories);
persist(KEY_TOPICS, topics);
persist(KEY_AUDIT, audit);
persist(KEY_TRAIN, trainingFiles);

/* UI initialization */
document.addEventListener('DOMContentLoaded', () => {
  // Attach login handlers
  $('btnLogin').addEventListener('click', doLogin);
  $('btnLogout').addEventListener('click', doLogout);

  // Enter key on inputs
  ['loginUser','loginPass'].forEach(id => {
    $(id).addEventListener('keydown', (e) => {
      if(e.key === 'Enter') doLogin();
    });
  });

  // Menu navigation
  document.querySelectorAll('.top-menu .menu-item').forEach(item=>{
    item.addEventListener('click', ()=>{
      if(item.classList.contains('disabled')) return;
      const target = item.getAttribute('data-target');
      showSection(target);
    });
  });

  // KB actions
  $('btnNewTopic').addEventListener('click', ()=> openNewTopic());
  $('btnNewCategory').addEventListener('click', ()=> openNewCategory());
  $('btnDeleteCategoryTop').addEventListener('click', ()=> openDeleteCategory());

  // User management
  $('btnCreateUser').addEventListener('click', createUser);

  // Training upload handler will be rendered in renderTraining()

  // Restore session if exists
  if(session && session.username){
    showDashboard();
  } else {
    showLogin();
  }

  updateCategorySelects();
  renderAll();
});

/* Login / Logout */
function doLogin(){
  const u = $('loginUser').value.trim();
  const p = $('loginPass').value;
  if(!u || !p){ alert("Preencha usuário e senha."); return; }
  users = load(KEY_USERS, users);
  const found = users.find(x => x.username === u && x.password === p);
  if(!found){ alert("Usuário ou senha inválidos"); return; }
  session = { username: found.username, name: found.name, role: found.role, ts: Date.now() };
  persist(KEY_SESSION, session);
  showDashboard();
  renderAll();
}

function doLogout(){
  session = null;
  localStorage.removeItem(KEY_SESSION);
  showLogin();
}

/* Show/hide screens */
function showLogin(){
  $('loginScreen').style.display = 'block';
  $('dashboard').style.display = 'none';
  $('loginUser').focus();
  $('headerUser').style.display = 'none';
}

function showDashboard(){
  $('loginScreen').style.display = 'none';
  $('dashboard').style.display = 'block';
  $('headerUser').style.display = 'flex';
  $('headerName').innerText = session.name || session.username;
  $('headerRole').innerText = `(${session.role})`;
  configureAccess();
}

/* Access control */
function configureAccess(){
  const role = session ? session.role.toLowerCase() : "";
  const menuUser = document.querySelector('[data-target="page-user"]');
  const menuAudit = document.querySelector('[data-target="page-audit"]');
  if(role === 'admin' || role === 'supervisor'){
    menuUser.classList.remove('disabled'); menuAudit.classList.remove('disabled');
  } else {
    menuUser.classList.add('disabled'); menuAudit.classList.add('disabled');
  }
  // Show/hide KB action buttons for non-managers
  const canManage = (role === 'admin' || role === 'supervisor');
  $('btnNewTopic').style.display = canManage ? 'inline-flex' : 'none';
  $('btnNewCategory').style.display = canManage ? 'inline-flex' : 'none';
  $('btnDeleteCategoryTop').style.display = canManage ? 'inline-flex' : 'none';
  populateNewUserRoleOptions(role === 'admin');
}

/* Sections */
function showSection(id){
  document.querySelectorAll('.page').forEach(p=>{
    if(p.id === id){ p.classList.add('active'); p.style.display = 'block'; p.setAttribute('aria-hidden','false'); }
    else { p.classList.remove('active'); p.style.display = 'none'; p.setAttribute('aria-hidden','true'); }
  });
  if(id === 'page-kb'){ renderTopics(); }
  if(id === 'page-user'){ renderUsers(); }
  if(id === 'page-training'){ renderTraining(); }
  if(id === 'page-audit'){ renderAudit(); }
}

/* Categories */
function updateCategorySelects(){
  categories = Array.from(new Set(categories.filter(Boolean)));
  persist(KEY_CATS, categories);
  const filter = $('filterCategory');
  filter.innerHTML = `<option value="">Todas as categorias</option>`;
  categories.forEach(c => filter.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`));
}

/* Topics rendering and comment flows */
function renderTopics(){
  const q = ($('searchAll') && $('searchAll').value || "").trim().toLowerCase();
  const cat = ($('filterCategory') && $('filterCategory').value) || "";
  const container = $('topicsList');
  topics = load(KEY_TOPICS, topics);
  container.innerHTML = "";
  const filtered = topics.filter(t => {
    const matchCat = !cat || t.category === cat;
    if(!q) return matchCat;
    const inTitle = (t.title||"").toLowerCase().includes(q);
    const inContent = (t.content||"").toLowerCase().includes(q);
    const inCategory = (t.category||"").toLowerCase().includes(q);
    const commentsText = (t.comments||[]).map(c => (c.text||"")).join(" ").toLowerCase();
    return matchCat && (inTitle || inContent || inCategory || commentsText.includes(q));
  });

  if(filtered.length === 0){
    container.innerHTML = `<div class="topic"><div class="small">Nenhum tópico encontrado.</div></div>`;
    return;
  }

  filtered.forEach(t => {
    const article = document.createElement('article');
    article.className = 'topic';
    article.id = `topic-${t.id}`;
    const catHtml = t.category ? `<div class="badge">${escapeHtml(t.category)}</div>` : `<div class="small">Sem categoria</div>`;
    const commentsHtml = (t.comments||[]).map(c => {
      const statusClass = c.status === "pending" ? "status-pending" : (c.status === "approved" ? "status-approved" : "status-rejected");
      const statusLabel = c.status === "pending" ? "Pendente" : (c.status === "approved" ? "Aprovado" : "Rejeitado");
      const author = escapeHtml(c.authorName || c.author);
      const commentId = c.id;
      let actions = "";
      const role = session ? session.role.toLowerCase() : "";
      if(session && (role === "admin" || role === "supervisor") && c.status === "pending"){
        actions += `<button class="btn" data-action="approve-comment" data-topic="${t.id}" data-cid="${commentId}">Aprovar</button>`;
        actions += `<button class="btn warn" data-action="reject-comment" data-topic="${t.id}" data-cid="${commentId}">Rejeitar</button>`;
      }
      return `<div id="comment-${commentId}" class="comment-block"><div class="comment-meta"><strong class="small">${author}</strong><div class="small">${new Date(c.ts).toLocaleString()}</div><div class="status-pill ${statusClass}">${statusLabel}</div></div><div style="margin-top:6px">${escapeHtml(c.text)}</div><div style="margin-top:8px">${actions}</div></div>`;
    }).join("");

    article.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="flex:1">
          <h3 style="margin:0;color:var(--accent)">${escapeHtml(t.title)}</h3>
          <div class="small" style="margin-top:6px">${escapeHtml(t.content)}</div>
        </div>
        <div>${catHtml}</div>
      </div>
      <div style="margin-top:10px"><strong class="small">Comentários</strong>${commentsHtml || `<div class="small" style="margin-top:6px">Sem comentários</div>`}</div>

      <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
        <input type="text" placeholder="Adicionar comentário" id="comment-text-${t.id}" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:var(--text)">
        <button class="btn" data-action="send-comment" data-id="${t.id}">Enviar</button>
      </div>
    `;
    container.appendChild(article);
  });

  attachTopicEventHandlers();
  updatePendingPanel();
}

/* Attach comment action handlers */
function attachTopicEventHandlers(){
  // send comment
  document.querySelectorAll('button[data-action="send-comment"]').forEach(btn=>{
    btn.onclick = () => {
      const tid = btn.getAttribute('data-id');
      const textEl = $(`comment-text-${tid}`);
      const text = (textEl && textEl.value.trim()) || "";
      if(!text) return alert("Digite um comentário.");
      if(!session) return alert("Faça login para comentar.");
      const role = session.role.toLowerCase();
      const status = (role === "user") ? "pending" : "approved";
      const comment = { id: idGen(), author: session.username, authorName: session.name, text, media: [], ts: Date.now(), status };
      const topic = topics.find(t => t.id === tid);
      if(!topic) return alert("Tópico não encontrado.");
      topic.comments = topic.comments || [];
      topic.comments.push(comment);
      persist(KEY_TOPICS, topics);
      persistAudit(`Comentário "${comment.id}" no tópico "${topic.title}" por ${session.username} (status: ${status})`);
      if(status === "pending") notifySupervisorsPending();
      textEl.value = "";
      renderTopics();
    };
  });

  // approve/reject
  document.querySelectorAll('button[data-action="approve-comment"]').forEach(btn=>{
    btn.onclick = () => {
      const tid = btn.getAttribute('data-topic'); const cid = btn.getAttribute('data-cid');
      if(!session) return alert("Faça login.");
      const role = session.role.toLowerCase(); if(role !== "admin" && role !== "supervisor") return alert("Acesso negado.");
      const topic = topics.find(t => t.id === tid); if(!topic) return;
      const comment = topic.comments.find(c => c.id === cid); if(!comment) return;
      comment.status = "approved"; comment.approvedBy = session.username; comment.approvedAt = Date.now();
      persist(KEY_TOPICS, topics);
      persistAudit(`Comentário "${cid}" aprovado por ${session.username}`);
      renderTopics(); renderAudit();
    };
  });

  document.querySelectorAll('button[data-action="reject-comment"]').forEach(btn=>{
    btn.onclick = () => {
      const tid = btn.getAttribute('data-topic'); const cid = btn.getAttribute('data-cid');
      if(!session) return alert("Faça login.");
      const role = session.role.toLowerCase(); if(role !== "admin" && role !== "supervisor") return alert("Acesso negado.");
      const topic = topics.find(t => t.id === tid); if(!topic) return;
      const comment = topic.comments.find(c => c.id === cid); if(!comment) return;
      const reason = prompt("Motivo da rejeição (opcional):", "");
      comment.status = "rejected"; comment.rejectedBy = session.username; comment.rejectedAt = Date.now(); comment.rejectionReason = reason || "";
      persist(KEY_TOPICS, topics);
      persistAudit(`Comentário "${cid}" rejeitado por ${session.username} (${reason || "sem motivo"})`);
      renderTopics(); renderAudit();
    };
  });
}

/* Pending notifications */
function getPendingComments(){
  const arr = [];
  topics.forEach(t => {
    (t.comments||[]).forEach(c => {
      if(c.status === "pending") arr.push({ topicId: t.id, topicTitle: t.title, commentId: c.id, author: c.author, ts: c.ts });
    });
  });
  return arr;
}

function notifySupervisorsPending(){
  // If current user is supervisor/admin, show central popup; otherwise pending panel will be visible when supervisors log in
  if(!session) return;
  const role = session.role.toLowerCase();
  if(role === "admin" || role === "supervisor") showCentralPendingPopup();
  else updatePendingPanel();
}

function showCentralPendingPopup(){
  const pending = getPendingComments();
  if(pending.length === 0) return;
  const container = $('popupContainer'); container.innerHTML = "";
  const overlay = document.createElement('div'); overlay.className = 'popup-overlay';
  const box = document.createElement('div'); box.className = 'popup-box';
  box.innerHTML = `<h3>Existem ${pending.length} comentários pendentes</h3><div id="centralPendingList" style="margin-top:10px"></div><div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end"><button class="btn ghost" id="centralClose">Fechar</button></div>`;
  overlay.appendChild(box);
  container.appendChild(overlay);
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
        if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('highlight'); setTimeout(()=> el.classList.remove('highlight'), 2000); }
      }, 200);
    };
  });
  $('centralClose').onclick = () => closeCentralPopup();
}

function closeCentralPopup(){ $('popupContainer').innerHTML = ""; }

function updatePendingPanel(){
  // bottom-right panel (rendered only when there are pending comments)
  let panel = document.getElementById('pendingPanel');
  if(!panel){
    panel = document.createElement('div'); panel.id = 'pendingPanel'; panel.className = 'pending-panel'; panel.style.display = 'none';
    panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>Comentários pendentes</strong><button class="btn ghost" id="btnClosePending">Fechar</button></div><div id="pendingList" style="margin-top:8px"></div>`;
    document.body.appendChild(panel);
    document.getElementById('btnClosePending').onclick = ()=> panel.style.display = 'none';
  }
  const pending = getPendingComments();
  const list = $('pendingList');
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
        if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('highlight'); setTimeout(()=> el.classList.remove('highlight'), 2000); }
      }, 200);
    };
  });
}

/* Audit */
function persistAudit(msg){
  const arr = load(KEY_AUDIT, audit);
  arr.unshift(`${new Date().toLocaleString()} — ${msg}`);
  persist(KEY_AUDIT, arr.slice(0,500));
  audit = arr;
}

function renderAudit(){
  const panel = $('auditLog');
  const sess = session;
  const role = sess ? sess.role.toLowerCase() : "";
  const logs = load(KEY_AUDIT, audit);
  const pending = getPendingComments();
  let html = "";
  if(role === "supervisor"){
    html += `<div style="margin-bottom:8px"><strong class="small">Pendências de aprovação</strong></div>`;
    if(pending.length === 0) html += `<div class="small">Sem pendências.</div>`;
    else pending.forEach(p => html += `<div class="audit-item"><div class="info small"><strong>${escapeHtml(p.topicTitle)}</strong><div style="margin-top:4px">Comentário ${escapeHtml(p.commentId)} por ${escapeHtml(p.author)}</div></div><div class="goto"><button class="btn visit" data-action="audit-goto" data-topic="${p.topicId}" data-cid="${p.commentId}">Ir</button></div></div>`);
    panel.innerHTML = html;
  } else {
    if(pending.length > 0){
      html += `<div style="margin-bottom:8px"><strong class="small">Pendências de aprovação</strong></div>`;
      pending.forEach(p => html += `<div class="audit-item"><div class="info small"><strong>${escapeHtml(p.topicTitle)}</strong><div style="margin-top:4px">Comentário ${escapeHtml(p.commentId)} por ${escapeHtml(p.author)}</div></div><div class="goto"><button class="btn visit" data-action="audit-goto" data-topic="${p.topicId}" data-cid="${p.commentId}">Ir</button></div></div>`);
      html += `<hr style="border-color:rgba(255,255,255,0.04);margin:8px 0">`;
    }
    if(!logs || logs.length === 0) html += `<div class="small">Sem registros.</div>`; else html += logs.map(l=> `<div class="small" style="margin-bottom:6px">${escapeHtml(l)}</div>`).join('');
    panel.innerHTML = html;
  }

  // attach goto handlers
  panel.querySelectorAll('button[data-action="audit-goto"]').forEach(b=>{
    b.onclick = ()=> {
      const tid = b.getAttribute('data-topic'); const cid = b.getAttribute('data-cid');
      showSection('page-kb'); renderTopics();
      setTimeout(()=> {
        const el = document.getElementById(`comment-${cid}`);
        if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('highlight'); setTimeout(()=> el.classList.remove('highlight'), 2000); }
      }, 200);
    };
  });
}

/* Training */
function renderTraining(){
  const sess = session;
  const up = $('trainingUpload');
  const filesList = $('trainingFiles');
  const stored = load(KEY_TRAIN, trainingFiles);
  filesList.innerHTML = stored.map(f=> `<div class="small">${escapeHtml(f)}</div>`).join("");
  if(!sess){ up.innerHTML = `<div class="small">Faça login para acessar o treinamento.</div>`; return; }
  const role = sess.role.toLowerCase();
  if(role === "admin" || role === "supervisor"){
    up.innerHTML = `<input type="file" id="trainFile" multiple accept=".pdf,.doc,.docx,video/*"><div style="margin-top:8px"><button class="btn" id="btnUploadTrain">Enviar</button></div>`;
    $('btnUploadTrain').onclick = ()=> {
      const input = $('trainFile');
      const files = Array.from(input.files || []);
      const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const storedFiles = load(KEY_TRAIN, trainingFiles);
      files.forEach(f=>{
        if(f.type.startsWith('video/') || allowed.includes(f.type) || f.name.match(/\.(pdf|doc|docx)$/i)){
          storedFiles.push(f.name);
        } else {
          alert(`Arquivo "${f.name}" não é permitido e foi ignorado.`);
        }
      });
      persist(KEY_TRAIN, storedFiles);
      renderTraining();
      persistAudit(`Arquivos de treinamento enviados por ${sess.username}`);
    };
  } else {
    up.innerHTML = `<div class="small">Somente Supervisor/Admin podem enviar arquivos.</div>`;
  }
}

/* User management */
function populateNewUserRoleOptions(isAdmin){
  const sel = $('newRole'); sel.innerHTML = "";
  if(isAdmin){ ["Admin","Supervisor","User"].forEach(r=> sel.insertAdjacentHTML('beforeend', `<option value="${r}">${r}</option>`)); }
  else { sel.insertAdjacentHTML('beforeend', `<option value="User">User</option>`); sel.value = "User"; }
}

function createUser(){
  const s = session; if(!s) return alert("Faça login.");
  const roleCurrent = s.role.toLowerCase(); if(roleCurrent !== "admin" && roleCurrent !== "supervisor") return alert("Acesso negado.");
  let name = $('newName').value.trim(); let username = $('newLogin').value.trim(); let pass = $('newPass').value; let role = $('newRole').value || "User";
  if(!name || !username || !pass) return alert("Preencha nome, usuário e senha.");
  users = load(KEY_USERS, users);
  if(users.some(u=> u.username === username)) return alert("Usuário já existe.");
  if(roleCurrent === "supervisor") role = "User";
  users.push({ username, password: pass, name, role }); persist(KEY_USERS, users);
  persistAudit(`Usuário "${username}" criado por ${s.username} com papel ${role}`);
  $('newName').value = ""; $('newLogin').value = ""; $('newPass').value = "";
  renderUsers();
  alert(`Usuário "${username}" criado.`);
}

function renderUsers(){
  const container = $('usersList'); container.innerHTML = "";
  users = load(KEY_USERS, users);
  users.forEach(u=>{
    const el = document.createElement('div'); el.className = 'user-item card';
    el.style.marginBottom = '8px';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong style="color:var(--accent)">${escapeHtml(u.name)}</strong><div class="small">${escapeHtml(u.username)} — ${escapeHtml(u.role)}</div></div><div style="display:flex;gap:8px"><button class="btn ghost" data-action="edit-name" data-user="${escapeHtml(u.username)}">Editar</button><button class="btn ghost" data-action="change-pass" data-user="${escapeHtml(u.username)}">Alterar senha</button><button class="btn warn" data-action="delete-user" data-user="${escapeHtml(u.username)}">Excluir</button></div></div>`;
    container.appendChild(el);
  });
  container.querySelectorAll('button[data-action="edit-name"]').forEach(b=> b.onclick = ()=> editUserName(b.getAttribute('data-user')));
  container.querySelectorAll('button[data-action="change-pass"]').forEach(b=> b.onclick = ()=> changeUserPassword(b.getAttribute('data-user')));
  container.querySelectorAll('button[data-action="delete-user"]').forEach(b=> b.onclick = ()=> deleteUser(b.getAttribute('data-user')));
}

function editUserName(username){
  const s = session; if(!s) return alert("Faça login.");
  const roleCurrent = s.role.toLowerCase(); if(roleCurrent !== "admin" && roleCurrent !== "supervisor") return alert("Acesso negado.");
  users = load(KEY_USERS, users);
  const u = users.find(x=> x.username === username); if(!u) return alert("Usuário não encontrado.");
  const newName = prompt("Novo nome:", u.name); if(!newName) return;
  u.name = newName; persist(KEY_USERS, users); persistAudit(`Nome do usuário ${username} alterado para "${newName}" por ${s.username}`); renderUsers(); alert("Nome atualizado.");
}

function changeUserPassword(username){
  const s = session; if(!s) return alert("Faça login.");
  const roleCurrent = s.role.toLowerCase(); if(roleCurrent !== "admin" && roleCurrent !== "supervisor") return alert("Acesso negado.");
  users = load(KEY_USERS, users);
  const u = users.find(x=> x.username === username); if(!u) return alert("Usuário não encontrado.");
  if(roleCurrent === "supervisor" && u.role.toLowerCase() === "admin") return alert("Supervisor não pode alterar senha do Admin.");
  const newPass = prompt(`Digite a nova senha para "${username}":`); if(!newPass) return alert("Operação cancelada.");
  u.password = newPass; persist(KEY_USERS, users); persistAudit(`Senha de ${username} alterada por ${s.username}`); alert("Senha alterada.");
}

function deleteUser(username){
  const s = session; if(!s) return alert("Faça login.");
  const roleCurrent = s.role.toLowerCase(); if(roleCurrent !== "admin" && roleCurrent !== "supervisor") return alert("Acesso negado.");
  users = load(KEY_USERS, users);
  const target = users.find(u=> u.username === username); if(!target) return alert("Usuário não encontrado.");
  if(target.role.toLowerCase() === "admin"){
    if(roleCurrent === "supervisor") return alert("Supervisor não pode excluir usuário Admin.");
    const otherAdmins = users.filter(u=> u.username !== username && u.role.toLowerCase() === "admin").length;
    if(otherAdmins === 0){
      const confirmText = prompt("Você está prestes a excluir o último Admin. Para confirmar, digite CONFIRMAR (maiúsculo).");
      if(confirmText !== "CONFIRMAR"){ alert("Operação cancelada."); return; }
    } else {
      if(!confirm(`Excluir o usuário Admin "${username}"? Esta ação é irreversível.`)) return;
    }
  } else {
    if(!confirm(`Deseja excluir o usuário "${username}"?`)) return;
  }
  users = users.filter(u=> u.username !== username); persist(KEY_USERS, users); persistAudit(`Usuário "${username}" excluído por ${s.username}`); renderUsers(); alert(`Usuário "${username}" excluído.`);
}

/* Topic/category flows (simplified UI for create/delete) */
function openNewTopic(){
  const s = session; if(!s) return alert("Faça login.");
  const role = s.role.toLowerCase(); if(role !== "admin" && role !== "supervisor") return alert("Acesso negado.");
  const title = prompt("Título do tópico:");
  if(!title) return;
  const content = prompt("Descrição do tópico:", "");
  const category = prompt("Categoria (ex: HTML, CSS):", categories[0] || "");
  const status = (role === "user") ? "pending" : "approved";
  const t = { id: idGen(), title, content: content || "", category: category || "", media: [], comments: [], status };
  topics.push(t); persist(KEY_TOPICS, topics);
  persistAudit(`Tópico "${title}" criado por ${s.username} (status: ${status})`);
  if(status === "pending") notifySupervisorsPending();
  renderTopics();
}

function openNewCategory(){
  const s = session; if(!s) return alert("Faça login.");
  const role = s.role.toLowerCase(); if(role !== "admin" && role !== "supervisor") return alert("Acesso negado.");
  const name = prompt("Nome da nova categoria:");
  if(!name) return;
  if(categories.includes(name)) return alert("Categoria já existe.");
  categories.push(name); persist(KEY_CATS, categories); persistAudit(`Categoria "${name}" criada por ${s.username}`); updateCategorySelects(); alert("Categoria criada.");
}

function openDeleteCategory(){
  const s = session; if(!s) return alert("Faça login.");
  const role = s.role.toLowerCase(); if(role !== "admin" && role !== "supervisor") return alert("Acesso negado.");
  const name = prompt("Nome da categoria a excluir:");
  if(!name) return;
  if(!categories.includes(name)) return alert("Categoria não encontrada.");
  const usedBy = topics.filter(t=> t.category === name).length;
  let msg = `Deseja excluir a categoria "${name}" do sistema?`;
  if(usedBy > 0) msg += `\n\n${usedBy} tópico(s) usam essa categoria. Eles ficarão sem categoria.`;
  if(!confirm(msg)) return;
  categories = categories.filter(c=> c !== name); topics = topics.map(t => t.category === name ? ({ ...t, category: "" }) : t);
  persist(KEY_CATS, categories); persist(KEY_TOPICS, topics); persistAudit(`Categoria "${name}" excluída por ${s.username}`); updateCategorySelects(); renderTopics(); alert(`Categoria "${name}" removida.`);
}

/* Utilities */
function renderAll(){
  updateCategorySelects();
  renderTopics();
  renderUsers();
  renderTraining();
  renderAudit();
  updatePendingPanel();
}
