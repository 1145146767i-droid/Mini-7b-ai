const chat=document.querySelector("#chat");
const input=document.querySelector("#input");
const form=document.querySelector("#form");
const clearBtn=document.querySelector("#clear");
const modelLabel=document.querySelector("#modelLabel");
const status=document.querySelector("#status");
const modelInfo=document.querySelector("#modelInfo");

let history=[];

function add(role,text){
  const row=document.createElement("div");
  row.className="message "+role;
  row.innerHTML='<div class="avatar">'+(role==="user"?"🧑":"🤖")+'</div><div class="bubble"></div>';
  row.querySelector(".bubble").textContent=text;
  chat.appendChild(row);
  chat.scrollTop=chat.scrollHeight;
}

function renderWelcome(){
  chat.innerHTML="";
  add("bot","你好！我是 Mini-7B。本版本会在你自己的设备上运行真实的 7B GGUF 模型，不再调用 OpenAI、Claude 等云端 API。");
}

async function refreshStatus(){
  try{
    const r=await fetch("/api/status",{cache:"no-store"});
    const d=await r.json();
    const name=d.model?.split(":").at(-1)||"Q4_K_M";
    modelLabel.textContent=d.phase==="ready"?"本地模型："+name:"本地模型加载中…";
    modelInfo.textContent=d.phase==="ready"
      ?"✅ 真本地推理 · 模型已加载"
      :d.phase==="error"
        ?"❌ 本地模型加载失败"
        :"⏳ 正在下载/加载本地模型";
    status.textContent=d.phase==="ready"
      ?"模型已就绪："+name
      :d.phase==="error"
        ?"模型错误：请查看页面提示或终端日志"
        :"第一次启动需要下载约 4–5 GB 的 7B Q4_K_M 模型，之后直接使用本地文件。";
    input.disabled=d.phase!=="ready";
    if(d.phase!=="ready" && d.phase!=="error"){
      setTimeout(refreshStatus,2500);
    }
  }catch(err){
    modelLabel.textContent="本地服务器未连接";
    modelInfo.textContent="请用 npm start 启动，而不是直接打开 HTML";
    status.textContent="无法连接本地服务器";
    input.disabled=true;
  }
}

clearBtn.onclick=()=>{
  history=[];
  renderWelcome();
};

form.onsubmit=async e=>{
  e.preventDefault();
  const q=input.value.trim();
  if(!q)return;

  add("user",q);
  history.push({role:"user",content:q});
  input.value="";
  input.disabled=true;

  const thinking=document.createElement("div");
  thinking.className="message bot";
  thinking.innerHTML='<div class="avatar">🤖</div><div class="bubble">本地模型正在思考…</div>';
  chat.appendChild(thinking);
  chat.scrollTop=chat.scrollHeight;

  try{
    const r=await fetch("/api/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:history})
    });
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||"本地模型请求失败");
    thinking.remove();
    add("bot",d.content||"模型没有返回文本。");
    history.push({role:"assistant",content:d.content||""});
  }catch(err){
    thinking.remove();
    add("bot","❌ "+err.message);
  }finally{
    await refreshStatus();
    input.disabled=false;
    input.focus();
  }
};

renderWelcome();
refreshStatus();