const http=require("http"),fs=require("fs"),path=require("path");
const PORT=process.env.PORT||3000,ROOT=__dirname;
const mime={".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",".css":"text/css;charset=utf-8"};
function send(res,status,type,data){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store"});res.end(data)}
const server=http.createServer(async(req,res)=>{
 if(req.method==="POST"&&req.url==="/api/chat"){
  if(!process.env.OPENAI_API_KEY)return send(res,500,"application/json",JSON.stringify({error:"服务器未设置 OPENAI_API_KEY"}));
  let raw="";req.on("data",c=>raw+=c);req.on("end",async()=>{
   try{const body=JSON.parse(raw),messages=Array.isArray(body.messages)?body.messages:[];
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-6-luna",instructions:"你是 Mini-7B，一个友好、准确、简洁的中文 AI 助手。",input:messages})});
    const data=await r.json();send(res,r.status,"application/json",JSON.stringify({content:data.output_text||"",error:data.error?.message}));
   }catch(e){send(res,500,"application/json",JSON.stringify({error:e.message}))}
  });return;
 }
 let p=req.url.split("?")[0];if(p==="/")p="/index.html";const file=path.join(ROOT,p);
 if(!file.startsWith(ROOT)||!fs.existsSync(file))return send(res,404,"text/plain","Not found");
 send(res,200,mime[path.extname(file)]||"text/plain",fs.readFileSync(file));
});
server.listen(PORT,()=>console.log("Mini-7B server listening on "+PORT));