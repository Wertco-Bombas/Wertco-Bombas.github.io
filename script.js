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
    div.innerHTML=`<h3 style="color:var(--accent)">${t.title}</h3><p>${t.content}</p>`;
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
function approve(tid,cid){
  let t=topics.find(x=>x.id===tid);
  if(t){let c=t.comments.find(c=>c.id===cid);if(c) c.status="approved";}
  audit.unshift(`${cid} aprovado`);
  renderTopics();renderAudit();
}
function reject(tid,cid){
  let t=topics.find(x=>x.id===tid);
  if(t){let c=t.comments.find(c=>c.id===cid);if(c) c.status="rejected";}
  audit.unshift(`${cid} rejeitado`);
  renderTopics();renderAudit();
}
function renderAudit(){
  document.getElementById("auditLog").innerHTML=audit.map(a=>`<div>${a}</div>`).join("");
}
function renderTraining(){
  document.getElementById("trainingUpload").innerHTML=`<input type="file" id="trainFile" multiple accept=".pdf,.doc,.docx,video/*"><button class="btn" onclick="saveTraining()">Enviar</button>`;
  document.getElementById("trainingFiles").innerHTML=trainingFiles.map(f=>`<div>${f}</div>`).join("");
}
function
