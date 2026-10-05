# Mini-7B AI 🤖

一个**真正运行本地 7B 大模型**的网页版聊天项目。

本版本不再通过 OpenAI API 获取回答，而是使用 Node.js + `node-llama-cpp` 在本机加载 GGUF 权重并完成推理。

## 默认模型

默认使用 Qwen 官方发布的 **Qwen2.5-7B-Instruct-GGUF:Q4_K_M**。

Q4_K_M 是约 4～5 GB 级别的量化权重；官方仓库以分片 GGUF 文件提供。第一次启动时，程序会把模型下载到本项目的 `models/` 目录；以后直接读取本地文件。

> GitHub 仓库本身不包含数 GB 的模型权重，因此“部署在仓库里”这里指代码、配置和模型管理逻辑都在仓库中，权重首次运行下载到你的设备。

## 运行

需要 Node.js。

```bash
npm install
npm start
```

然后打开：

```
http://localhost:3000
```

首次启动会自动下载并加载本地 7B 模型。下载完成后，聊天推理在你的设备上进行，不需要 API Key。

也可以提前手动下载：

```bash
npm run models:pull
```

## 本地模型位置

默认：

```
./models
```

也可以指定：

```bash
MODEL_DIR=/你的模型目录 npm start
```

切换 Hugging Face GGUF 模型：

```bash
LOCAL_MODEL_URI=hf:某用户/某模型:Q4_K_M npm start
```

## 运行参数

```
PORT=3000
MAX_TOKENS=1024
TEMPERATURE=0.7
```

`node-llama-cpp` 提供 macOS、Linux、Windows 的预构建绑定，并会根据硬件自动选择合适的运行方式；不匹配的平台可能回退到本地编译。

## 项目结构

- `index.html`：聊天界面
- `style.css`：界面样式
- `app.js`：前端与本地服务器通信
- `server.js`：本地模型加载、推理与 HTTP 服务
- `package.json`：依赖与模型下载脚本
- `.env.example`：可选环境变量
- `.gitignore`：防止把数 GB 模型权重提交进 GitHub

## 注意

这个项目必须通过 `npm start` 运行。直接在 GitHub Pages 打开 `index.html` 无法进行本地 7B 推理，因为 GitHub Pages 没有权限访问你的本机模型和 Node.js 进程。

7B 模型非常吃内存/显存。Q4_K_M 的模型文件本身就约 4～5 GB，实际运行还需要额外内存；手机、低内存电脑可能加载失败或速度很慢。

## 模型来源

默认模型来自 Qwen 官方 Hugging Face 仓库：

`Qwen/Qwen2.5-7B-Instruct-GGUF`

模型许可与具体条款以模型仓库为准。