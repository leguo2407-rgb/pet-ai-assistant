# 宠创 AI｜宠物带货专用 AI 助手

一个面向抖音宠物带货新手博主的纯前端多页面 MVP。无需登录和后端，支持本地存储与 OpenAI 兼容接口。

## 项目结构

```text
pet-ai-assistant/
├── index.html
├── pages/
│   ├── analyze.html
│   ├── script.html
│   ├── persona.html
│   ├── templates.html
│   ├── library.html
│   └── history.html
├── assets/
│   ├── style.css
│   ├── app.js
│   ├── ai.js
│   ├── data.js
│   └── storage.js
├── data/
│   └── templates.json
│   └── copy-library.json
└── README.md
```

## 本地运行

项目没有构建依赖。在项目目录启动任意静态文件服务器：

```bash
python3 -m http.server 5173
```

浏览器访问 `http://localhost:5173`。

## 功能

- 宠物商品脚本生成
- 宠物带货文案库（9 个品类 × 30 条，共 270 条）
- 宠物账号人设分析
- 爆款视频模板库与分类筛选
- AI 接口配置与演示模式
- 最近 20 次生成结果本地保存
- 桌面端与移动端自适应

## AI 接口

点击左下角“AI 接口设置”，填写 OpenAI 兼容接口地址、模型名和 API Key。密钥仅存储在当前浏览器的 `localStorage` 中。

> 纯前端保存密钥适合本地 MVP，不适合公开部署。正式上线时应增加后端代理，避免密钥暴露。
