import { load } from "./storage.js";

const systemPrompt = `你是专业的抖音宠物带货内容策划，服务对象是新手博主。
输出必须具体、可直接执行，避免空话；符合短视频口语表达；不得虚构商品功效或使用绝对化宣传词。
生成前必须核对商品名称、商品类别、核心卖点和宠物类型。标题、痛点、场景、道具、台词必须围绕同一商品，不得把狗粮写成饮水机、水碗或其他品类。
请始终使用简体中文，并严格按用户要求的结构输出。`;

export async function generateWithAI(prompt, demoFactory, images = []) {
  const settings = load("settings", {});
  if (!settings.apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { content: demoFactory(), demo: true };
  }

  const endpoint = settings.endpoint || "https://api.openai.com/v1/chat/completions";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model || "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 1400,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: images.length ? [
              { type: "text", text: prompt },
              ...images.map(url => ({ type: "image_url", image_url: { url, detail: "low" } })),
            ] : prompt,
          },
        ],
      }),
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("AI 接口响应超时，请检查接口地址、网络或更换更快的模型");
    }
    throw new Error(`无法连接 AI 接口：${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `接口请求失败（${response.status}）`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("接口未返回有效内容");
  return { content, demo: false };
}

export async function transcribeMedia(file) {
  const settings = load("settings", {});
  if (!settings.apiKey) throw new Error("语音转文字需要先配置 OpenAI API Key");
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("视频超过语音转写的 25MB 限制，请先压缩或截取后上传");
  }
  const chatEndpoint = settings.endpoint || "https://api.openai.com/v1/chat/completions";
  if (!chatEndpoint.includes("/chat/completions")) {
    throw new Error("当前接口地址无法推导语音转写地址，请使用以 /chat/completions 结尾的 OpenAI 兼容接口");
  }
  const endpoint = chatEndpoint.replace(/\/chat\/completions\/?$/, "/audio/transcriptions");
  const body = new FormData();
  body.append("file", file, file.name);
  body.append("model", "gpt-4o-mini-transcribe");
  body.append("language", "zh");
  body.append("response_format", "json");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${settings.apiKey}` },
      body,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || `语音转写失败（${response.status}）`);
    }
    const data = await response.json();
    return data.text?.trim() || "";
  } catch (error) {
    if (error.name === "AbortError") throw new Error("语音转写超时，请压缩视频后重试");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
