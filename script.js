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

/* Login */
function doLogin(){
  let u=document.getElementById("loginUser").value.trim();
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
}
document.getElementById("btnLogin").onclick=doLogin;
/* Enter para logar */
["loginUser","loginPass"].forEach(id=>{
  document.getElementById(id).addEventListener("keypress",e=>{
    if(e.key==="Enter"){doLogin();}
  });
});
document.getElementById("btnLogout").onclick=()=>{
  session=null;
  document.getElementById("dashboard").style.display="none";
  document.getElementById("loginScreen").style.display="block";
};

/* Navegação */
document.querySelectorAll('.menu-item').forEach(item=>{
  item.addEventListener('click',()=>{
    showSection(item.getAttribute('data-target'));
  });
});
function showSection(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==="page-kb") renderTopics();
  if(id==="page-training") renderTraining();
  if(id==="page-audit") renderAudit();
  if(id==="page-user") renderUsers();
}

/* Renderizações */
function renderTopics(){
  let container=document.getElementById("topicsList");
  container.innerHTML="";
  topics.forEach(t=>{
    let div=document.createElement("div");
    div.className="topic";
    div.innerHTML=`<h3 style="color:var(--accent)">${t.title}</h3><p>${t.content}</p>`;
    t.comments.forEach
