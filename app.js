const chat=document.querySelector("#chat");
const input=document.querySelector("#input");
const form=document.querySelector("#form");
const clearBtn=document.querySelector("#clear");
let history=[];

function addMessage(role,text){
  const row=document.createElement("div");
  row.className="message "+role;
  row.innerHTML='<div class="avatar">'+(role==="user"?"🧑":"🤖")+'</div><div class="bubble"></div>';
  row.querySelector(".bubble").textContent=text;
  chat.appendChild(row);
  chat.scrollTop=chat.scrollHeight;
}

function remember(role,text){
  history.push({role,text});
  if(history.length>20) history.shift();
}

function answer(q){
  const s=q.trim().toLowerCase();
  if(!s) return "请先输入一些内容。";
  if(/^(你好|嗨|hello|hi|hey)/i.test(s)) return "你好！很高兴和你聊天。我是 Mini-7B 模拟器，可以进行简单的多轮对话。";
  if(s.includes("你是谁")||s.includes("介绍一下你")) return "我是 Mini-7B，一个用于演示 7B 级 AI 对话体验的轻量模拟器。我目前使用浏览器里的规则与上下文生成回答，并没有真正加载 70 亿参数神经网络。";
  if(s.includes("7b")||s.includes("70亿")) return "“7B”通常表示约 70 亿（7 billion）个参数。真正的 7B 模型需要实际的神经网络权重和推理引擎；本项目为了让手机浏览器也能直接运行，采用轻量模拟方式。";
  if(s.includes("github")) return "GitHub 是代码托管与协作平台，可以用来保存代码、提交版本、创建 Issue 和 Pull Request。";
  if(s.includes("1+1")||s.includes("一加一")) return "1 + 1 = 2。";
  if(s.includes("中国")&&s.includes("首都")) return "中国的首都是北京。";
  if(s.includes("天气")) return "我目前没有实时天气数据。你可以告诉我城市，我可以解释天气信息应该如何读取；如果接入天气 API，就能实现实时查询。";
  if(s.includes("谢谢")||s.includes("感谢")) return "不客气！还有什么想问的吗？";
  const previous=history.filter(x=>x.role==="user").slice(-3).map(x=>x.text);
  if(previous.length>1 && /^(为什么|那|然后|继续|它呢|他呢)/.test(s)){
    return "结合我们前面的对话来看，你是在继续追问刚才的话题。作为轻量模拟器，我会保留最近几轮上下文，但复杂问题的理解能力有限。";
  }
  if(q.length>120) return "这个问题比较长。作为轻量级模拟器，我建议把它拆成几个小问题，我可以逐个回答。";
  return "我理解你的问题是：“"+q+"”。我是一个轻量级 7B 行为模拟器，目前没有真正的通用大模型推理能力。你可以继续追问，我会结合最近的对话上下文进行回答。";
}

form.addEventListener("submit",e=>{
  e.preventDefault();
  const q=input.value.trim();
  if(!q)return;
  addMessage("user",q); remember("user",q); input.value=""; input.focus();
  const typing=document.createElement("div");
  typing.className="message bot"; typing.innerHTML='<div class="avatar">🤖</div><div class="bubble">正在思考…</div>';
  chat.appendChild(typing); chat.scrollTop=chat.scrollHeight;
  setTimeout(()=>{
    typing.remove();
    const a=answer(q); addMessage("bot",a); remember("assistant",a);
  },350);
});

clearBtn.addEventListener("click",()=>{
  history=[];
  chat.innerHTML='<div class="message bot"><div class="avatar">🤖</div><div class="bubble">对话已经清空。你好！我是 Mini-7B，你可以重新开始提问。</div></div>';
  input.focus();
});