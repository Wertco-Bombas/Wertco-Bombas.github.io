let users=[
  {username:"admin",password:"admin",role:"Admin"},
  {username:"supervisor",password:"supervisor",role:"Supervisor"},
  {username:"user",password:"user",role:"User"}
];
let session=null;
let topics=[
  {id:"t1",title:"HTML Básico",content:"Estrutura de páginas web",comments:[
    {id:"c1",author:"user",text:"Comentário pendente",status:"pending"}
  ]},
  {id:"t2",title:"CSS Avançado",content:"Estilização e responsividade",comments:[]}
];
let audit=[]; let trainingFiles=[];

function showSection(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==="page-kb") renderTopics();
  if(id==="page-training") renderTraining();
  if(id==="page-audit") renderAudit();
  if(id==="page-user") renderUsers();
}

function renderTopics(){
  let container=document.getElementById("topicsList");
  container.innerHTML="";
  topics.forEach(t=>{
    let div=document.createElement("div");
    div.className="topic";
    div.innerHTML=`<h3>${t.title}</h3><p>${t.content}</p>`;
    t.comments.forEach(c=>{
      div.innerHTML+=`<div class="status-pill status-${c.status}">${c.status}</div>`;
      if(session && (session.role==="Admin"||session.role==="Supervisor") && c.status==="pending"){
        div.innerHTML+=`<button class="btn visit" onclick="approve('${t.id}','${c.id}')">Aprovar</button>
                        <button class="btn warn" onclick="reject('${t.id}','${c.id}')">Rejeitar</button>`;
      }
    });
    container.appendChild(div);
  });
}
function newTopic(){
  let title=prompt("Título do tópico:");
  if(!title) return;
  let t={id:Date.now()+"",title,content:"Conteúdo...",comments:[],status:"pending"};
  topics.push(t);
  audit.unshift(`Tópico "${title}" criado por ${session.username} (pendente)`);
  showApprovalPopup("Tópico pendente de aprovação",t.id,"topic");
  renderTopics();
}
function showApprovalPopup(msg,id,type){
  let overlay=document.createElement("div");
  overlay.className="popup-overlay";
  overlay.innerHTML=`<div class="popup-box"><h3>${msg}</h3>
    <button class="btn visit" onclick="approve('${id}','${type}')">Aprovar</button>
    <button class="btn warn" onclick="reject('${id}','${type}')">Rejeitar</button>
    <button class="btn" onclick="closePopup()">Fechar</button></div>`;
  document.getElementById("popupContainer").appendChild(overlay);
}
function closePopup(){document.getElementById("popupContainer").innerHTML="";}
function approve(tid,cid){
  let t=topics.find(x=>x.id===tid);
  if(t){ if(cid==="topic") t.status="approved"; else {let c=t.comments.find(c=>c.id===cid); if(c) c.status="approved";}}
  audit.unshift(`${cid} aprovado`);
  closePopup();renderTopics();renderAudit();
}
function reject(tid,cid){
  let t=topics.find(x=>x.id===tid);
  if(t){ if(cid==="topic") t.status="rejected"; else {let c=t.comments.find(c=>c.id===cid); if