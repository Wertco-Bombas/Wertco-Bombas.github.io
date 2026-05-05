let session=null;
let topics=[];
let audit=[];
let trainingFiles=[];

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
    if(t.status==="pending") div.innerHTML+=`<div class="status-pill status-pending">Pendente</div>`;
    if(t.status==="approved") div.innerHTML+=`<div class="status-pill status-approved">Aprovado</div>`;
    if(t.status==="rejected") div.innerHTML+=`<div class="status-pill status-rejected">Rejeitado</div>`;
    container.appendChild(div);
  });
}

function newTopic(){
  let title=prompt("Título do tópico:");
  if(!title) return;
  let t={id:Date.now()+"",title,content:"Conteúdo...",status:"pending"};
  topics.push(t);
  audit.unshift(`Tópico "${title}" criado (pendente)`);
  renderTopics();
}

function renderAudit(){
  let log=document.getElementById("auditLog");
  log.innerHTML=audit.map(a=>`<div>${a}</div>`).join("");
}

function renderTraining(){
  let up=document.getElementById("trainingUpload");
  up.innerHTML=`<input type="file" id="trainFile" multiple accept=".pdf,.doc,.docx,video/*">
    <button onclick="saveTraining()">Enviar</button>`;
  document.getElementById("trainingFiles").innerHTML=trainingFiles.map(f=>`<div>${f}</div>`).join("");
}
function saveTraining(){
  let input=document.getElementById("trainFile");
  let files=Array.from(input.files);
  files.forEach(f=>trainingFiles.push(f.name));
  renderTraining();
}

function renderUsers(){
  document.getElementById("usersList").innerHTML="(lista de usuários aqui)";
}
