# Mini-7B AI 🤖

一个真正调用模型 API 的网页版 AI 聊天项目。

## 推荐运行方式

使用 Node.js 后端，让 API Key 只存在服务器环境变量：

```bash
export OPENAI_API_KEY="你的 API Key"
export OPENAI_MODEL="gpt-6-luna"
npm start
```

然后打开服务器地址（默认 http://localhost:3000）。

## 浏览器直连

网页的“API 设置”也支持直接填写 OpenAI-compatible API 地址、模型名和 Key。Key 会保存到浏览器 localStorage。

**不要把 API Key 提交到 GitHub，也不要在公共电脑上输入自己的 Key。**公开部署推荐使用 server.js 后端代理。

## 文件

- index.html：聊天界面
- style.css：界面样式
- app.js：前端聊天与 API 设置
- server.js：Node.js API 代理
- package.json：启动配置
- .env.example：环境变量示例

## 关于 7B

Mini-7B 是项目名称，并不意味着浏览器真的加载了 70 亿参数权重。现在真正负责回答的是 API 后面的模型。

OpenAI 的新集成应使用 Responses API；官方资料显示旧 Assistants API 已于 2026-08-26 停止服务。