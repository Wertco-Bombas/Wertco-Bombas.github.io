let users=[
  {username:"admin",password:"admin",role:"Admin"},
  {username:"supervisor",password:"supervisor",role:"Supervisor"},
  {username:"user",password:"user",role:"User"}
];
let session=null;
let topics=[]; let audit=[]; let trainingFiles=[];

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
    container.appendChild(div);
  });
}

function renderAudit(){
  document.getElementById("auditLog").innerHTML=audit.map(a=>`<div>${a}</div>`).join("");
}
function renderTraining(){
  document.getElementById("trainingUpload").innerHTML=`<input type="file" id="trainFile" multiple accept=".pdf,.doc,.docx,video/*"><button class="btn" onclick="saveTraining()">Enviar</button>`;
  document.getElementById("trainingFiles").innerHTML=trainingFiles.map(f=>`<div>${f}</div>`).join("");
}
function saveTraining(){
  let input=document.getElementById("trainFile");
  let files=Array.from(input.files);
  files.forEach(f=>trainingFiles.push(f.name));
  renderTraining();
}
function renderUsers(){
  document.getElementById("usersList").innerHTML=users.map(u=>`<div>${u.username} (${u.role})</div>`).join("");
}

/* Login */
document.getElementById("btnLogin").onclick=()=>{
  let u=document.getElementById("loginUser").value;
  let p=document.getElementById("loginPass").value;
  let found=users.find(x=>x.username===u && x.password===p);
  if(!found){alert("Usuário ou senha inválidos");return;}
  session=found;
  document.getElementById("loginScreen").style.display="none";
  document.getElementById("dashboard").style.display="block";
  document.getElementById("headerUser").style.display="flex";
  document.getElementById("headerName").innerText=found.username;
  document.getElementById("headerRole").innerText=`(${found.role})`;
  renderTopics();renderUsers();renderTraining();renderAudit();
};
document.getElementById("btnLogout").onclick=()=>{
  session=null;
  document.getElementById("dashboard").style.display="none";
  document.getElementById("loginScreen").style.display="block";
};
