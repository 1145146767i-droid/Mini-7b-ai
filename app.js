const chat=document.querySelector("#chat"),input=document.querySelector("#input"),form=document.querySelector("#form"),clearBtn=document.querySelector("#clear"),settings=document.querySelector("#settings"),modal=document.querySelector("#modal"),save=document.querySelector("#save"),cancel=document.querySelector("#cancel"),apiKey=document.querySelector("#apiKey"),baseUrl=document.querySelector("#baseUrl"),model=document.querySelector("#model"),status=document.querySelector("#status");
let history=[];
const cfg=()=>({key:localStorage.getItem("mini7b_key")||"",base:localStorage.getItem("mini7b_base")||"https://api.openai.com/v1",model:localStorage.getItem("mini7b_model")||"gpt-6-luna"});
function add(role,text){const row=document.createElement("div");row.className="message "+role;row.innerHTML='<div class="avatar">'+(role==="user"?"🧑":"🤖")+'</div><div class="bubble"></div>';row.querySelector(".bubble").textContent=text;chat.appendChild(row);chat.scrollTop=chat.scrollHeight}
function renderWelcome(){chat.innerHTML="";add("bot","你好！我是 Mini-7B。现在我可以通过真实模型 API 回答问题了。请先在“API 设置”中配置 Key。");}
function refresh(){const c=cfg();status.textContent=c.key?"已配置模型："+c.model:"未连接模型 · 请先配置 API";baseUrl.value=c.base;model.value=c.model}
function openModal(){const c=cfg();baseUrl.value=c.base;model.value=c.model;apiKey.value=c.key;modal.classList.remove("hidden")}
settings.onclick=openModal;cancel.onclick=()=>modal.classList.add("hidden");
save.onclick=()=>{localStorage.setItem("mini7b_key",apiKey.value.trim());localStorage.setItem("mini7b_base",baseUrl.value.trim().replace(/\/$/,""));localStorage.setItem("mini7b_model",model.value.trim());modal.classList.add("hidden");refresh();};
clearBtn.onclick=()=>{history=[];renderWelcome();};
async function callModel(){
 const c=cfg(); if(!c.key) throw new Error("还没有配置 API Key。");
 const res=await fetch(c.base+"/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+c.key},body:JSON.stringify({model:c.model,instructions:"你是 Mini-7B，一个友好、准确、简洁的中文 AI 助手。请根据对话上下文回答用户。不要声称自己真的有 70 亿参数；这里的 Mini-7B 是项目名称。",input:history})});
 const data=await res.json(); if(!res.ok) throw new Error(data.error?.message||"API 请求失败："+res.status);
 return data.output_text||data.output?.flatMap(x=>x.content||[]).map(x=>x.text||"").filter(Boolean).join("\n")||"模型没有返回文本。";
}
form.onsubmit=async e=>{e.preventDefault();const q=input.value.trim();if(!q)return;add("user",q);history.push({role:"user",content:q});input.value="";input.disabled=true;const t=document.createElement("div");t.className="message bot";t.innerHTML='<div class="avatar">🤖</div><div class="bubble">正在思考…</div>';chat.appendChild(t);chat.scrollTop=chat.scrollHeight;try{const a=await callModel();t.remove();add("bot",a);history.push({role:"assistant",content:a});}catch(err){t.remove();add("bot","❌ "+err.message+"\n\n如果你是在 GitHub Pages 上直接打开，确认 API 地址支持浏览器跨域；生产环境更推荐使用后端代理，并把 API Key 放到服务器环境变量。");}finally{input.disabled=false;input.focus();}};
renderWelcome();refresh();