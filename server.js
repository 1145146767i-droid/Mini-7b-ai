import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  getLlama,
  LlamaChatSession,
  resolveModelFile
} from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const MODEL_DIR = path.resolve(process.env.MODEL_DIR || path.join(ROOT, "models"));
const MODEL_URI = process.env.LOCAL_MODEL_URI || "hf:Qwen/Qwen2.5-7B-Instruct-GGUF:Q4_K_M";
const SYSTEM_PROMPT = "你是 Mini-7B，一个运行在用户自己设备上的本地 AI 助手。请使用中文回答，准确、自然、简洁。不要声称自己连接了云端 API；本程序的推理由本机上的 GGUF 模型完成。";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const state = {
  phase: "starting",
  modelPath: null,
  modelName: MODEL_URI,
  error: null
};

let llama = null;
let model = null;
let loadPromise = null;
let generationQueue = Promise.resolve();

function send(res, status, type, data) {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(data);
}

function json(res, status, value) {
  send(res, status, "application/json; charset=utf-8", JSON.stringify(value));
}

function safeText(value) {
  return typeof value === "string" ? value.slice(0, 20000) : "";
}

function toLocalHistory(messages) {
  const clean = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant"))
    .map(m => ({ role: m.role, content: safeText(m.content) }))
    .filter(m => m.content.trim());

  const last = clean.at(-1);
  const previous = clean.slice(0, -1);
  const history = [{ type: "system", text: SYSTEM_PROMPT }];

  for (const item of previous.slice(-20)) {
    if (item.role === "user") {
      history.push({ type: "user", text: item.content });
    } else {
      history.push({ type: "model", response: [item.content] });
    }
  }

  return { history, prompt: last?.role === "user" ? last.content : "" };
}

async function ensureModel() {
  if (model) return model;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      state.phase = "downloading/loading";
      state.error = null;
      fs.mkdirSync(MODEL_DIR, { recursive: true });

      const modelPath = await resolveModelFile(MODEL_URI, MODEL_DIR, {
        cli: true
      });
      state.modelPath = modelPath;

      llama = await getLlama();
      model = await llama.loadModel({ modelPath });
      state.phase = "ready";
      console.log("Local model ready:", MODEL_URI);
      console.log("Model file:", modelPath);
      return model;
    } catch (error) {
      state.phase = "error";
      state.error = error?.stack || String(error);
      console.error(state.error);
      throw error;
    }
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

async function generate(messages) {
  const localModel = await ensureModel();
  const { history, prompt } = toLocalHistory(messages);
  if (!prompt) throw new Error("最后一条消息必须是 user。");

  const context = await localModel.createContext();
  const session = new LlamaChatSession({
    contextSequence: context.getSequence()
  });

  if (history.length > 1) session.setChatHistory(history);

  try {
    return await session.prompt(prompt, {
      maxTokens: Number(process.env.MAX_TOKENS || 1024),
      temperature: Number(process.env.TEMPERATURE || 0.7),
      repeatPenalty: {
        penalty: 1.1,
        lastTokens: 64,
        penalizeNewLine: false
      }
    });
  } finally {
    session.dispose();
    context.dispose();
  }
}

function queueGenerate(messages) {
  const run = generationQueue.then(() => generate(messages));
  generationQueue = run.catch(() => {});
  return run;
}

async function start() {
  ensureModel().catch(() => {});
  
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);

    if (req.method === "GET" && url.pathname === "/api/status") {
      return json(res, 200, {
        local: true,
        phase: state.phase,
        model: state.modelName,
        modelPath: state.modelPath,
        error: state.error
      });
    }

    if (req.method === "POST" && url.pathname === "/api/chat") {
      if (!model) {
        return json(res, 503, {
          error: state.phase === "error"
            ? "本地模型加载失败：" + state.error
            : "本地模型正在下载/加载，请稍后再试。",
          phase: state.phase
        });
      }

      let raw = "";
      req.on("data", chunk => {
        raw += chunk;
        if (raw.length > 2_000_000) req.destroy();
      });

      req.on("end", async () => {
        try {
          const body = JSON.parse(raw || "{}");
          const messages = Array.isArray(body.messages) ? body.messages : [];
          const answer = await queueGenerate(messages);
          json(res, 200, {
            local: true,
            model: state.modelName,
            content: answer
          });
        } catch (error) {
          json(res, 500, {
            error: error?.message || String(error)
          });
        }
      });
      return;
    }

    let requested = decodeURIComponent(url.pathname);
    if (requested === "/") requested = "/index.html";

    const target = path.resolve(ROOT, "." + requested);
    if (!target.startsWith(ROOT + path.sep) && target !== ROOT) {
      return send(res, 403, "text/plain; charset=utf-8", "Forbidden");
    }

    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      return send(res, 404, "text/plain; charset=utf-8", "Not found");
    }

    const ext = path.extname(target).toLowerCase();
    send(res, 200, mime[ext] || "application/octet-stream", fs.readFileSync(target));
  });

  server.listen(PORT, () => {
    console.log(`Mini-7B local server: http://localhost:${PORT}`);
    console.log(`Model: ${MODEL_URI}`);
  });
}

start();