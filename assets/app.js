import { navItems, templates } from "./data.js";
import { copyLibrary } from "./copy-library.js";
import { load, save, remove } from "./storage.js";
import { generateWithAI, transcribeMedia } from "./ai.js";

const app = document.querySelector("#app");
let state = {
  page: document.body.dataset.page || "home",
  templateFilter: "全部",
  libraryFilter: "全部",
  selectedTemplate: null,
  history: load("history", []),
  currentResult: "",
  currentResultDate: null,
};

const root = document.body.dataset.root || ".";
const pageUrls = {
  home: `${root}/index.html`,
  script: `${root}/pages/script.html`,
  library: `${root}/pages/library.html`,
  persona: `${root}/pages/persona.html`,
  templates: `${root}/pages/templates.html`,
  history: `${root}/pages/history.html`,
};

const icons = {
  sparkle: `<svg viewBox="0 0 24 24"><path d="m12 2 1.4 5.2L18 10l-4.6 2.8L12 18l-1.4-5.2L6 10l4.6-2.8L12 2Z"/><path d="m19 15 .7 2.3L22 18.5l-2.3 1.2L19 22l-.7-2.3-2.3-1.2 2.3-1.2L19 15Z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  copy: `<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`,
};

function shell(content) {
  return `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">P</span><div><b>宠创 AI</b><small>PET CREATOR</small></div></div>
        <nav>
          ${navItems.map(([id, icon, label]) => `<a href="${pageUrls[id]}" class="${state.page === id ? "active" : ""}"><span>${icon}</span>${label}</a>`).join("")}
        </nav>
        <div class="sidebar-bottom">
          <button class="settings-link" data-action="settings">⚙ <span>AI 接口设置</span></button>
          <div class="status-card"><i></i><div><b>本地数据已保护</b><small>内容仅保存在本机浏览器</small></div></div>
        </div>
      </aside>
      <main>
        <header><div class="mobile-brand"><span class="brand-mark">P</span> 宠创 AI</div><div class="header-right"><div class="pet-crew" aria-label="猫狗创作搭档"><span>🐱</span><span>🐶</span></div><div class="header-tip">专为宠物带货博主打造的内容增长工具</div><button class="icon-btn" data-action="settings">⚙</button></div></header>
        <div class="mobile-nav">${navItems.map(([id,,label]) => `<a href="${pageUrls[id]}" class="${state.page === id ? "active" : ""}">${label}</a>`).join("")}</div>
        <section class="content">${content}</section>
      </main>
    </div>
    <div id="modal-root"></div>`;
}

const field = (label, name, placeholder, type = "input", options = [], required = true) => `
  <label class="field"><span>${label}</span>
  ${type === "textarea" ? `<textarea name="${name}" placeholder="${placeholder}" ${required ? "required" : ""}></textarea>` :
    type === "select" ? `<select name="${name}">${options.map(x => `<option>${x}</option>`).join("")}</select>` :
    `<input name="${name}" placeholder="${placeholder}" ${required ? "required" : ""} />`}</label>`;

function pageIntro(kicker, title, desc) {
  return `<div class="page-intro"><div class="intro-pet intro-cat">🐱</div><div class="intro-pet intro-dog">🐶</div><div class="kicker">${icons.sparkle} ${kicker}</div><h1>${title}</h1><p>${desc}</p></div>`;
}

function homePage() {
  return `
    <div class="hero">
      <div class="hero-copy"><div class="eyebrow">AI 驱动 · 让宠物内容更好卖</div>
      <h1>从灵感到爆款，<br><em>一站式搞定</em></h1>
      <p>不会写脚本、不懂人设、找不到爆款规律？<br>让 AI 成为你的专属宠物内容策划。</p>
      <div class="hero-actions"><a href="${pageUrls.script}" class="btn primary">${icons.sparkle} 开始创作</a><a href="${pageUrls.templates}" class="btn ghost">浏览模板库 ${icons.arrow}</a></div>
      <div class="trust-row"><span>✓ 无需登录</span><span>✓ 数据本地存储</span><span>✓ 新手友好</span></div></div>
      <div class="hero-art"><div class="blob"></div><div class="pet-card cat"><span>🐱</span><b>这个开头，<br>完播率高了 37%</b></div><div class="pet-card dog"><span>🐶</span><b>脚本生成完毕！</b><small>预计 38 秒</small></div><div class="floating-tag">✦ AI 正在分析爆款因子...</div></div>
    </div>
    <div class="section-head"><div><span>三大核心能力</span><h2>你的内容创作搭档</h2></div><p>从定位、策划到落地，覆盖宠物带货创作流程</p></div>
    <div class="feature-grid">
      ${[
        ["script","01","宠物商品脚本","输入商品卖点，快速生成能拍、能演、能带货的短视频脚本。","生成带货脚本","peach"],
        ["persona","02","账号人设分析","根据账号现状与目标，找到差异化定位和可持续的内容方向。","诊断账号人设","mint"],
        ["templates","03","爆款模板库","沉淀高复用的爆款结构，新手套用也能快速找到创作手感。","查看爆款模板","blue"],
      ].map(([id,n,t,d,a,c]) => `<article class="feature-card ${c}"><div class="feature-top"><i>${n}</i><span>→</span></div><h3>${t}</h3><p>${d}</p><a href="${pageUrls[id]}">${a} ${icons.arrow}</a></article>`).join("")}
    </div>`;
}

function buildAnalyzeDetailedDemo(data) {
  const raw = (data.content || "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const content = raw || "未提供文案";
  const excerpt = content.slice(0, 90);
  const hashtags = [...content.matchAll(/#\s*([^#\s]+)/g)].map(match => match[1]).slice(0, 5);
  const promo = content.match(/(买[^！!。，\n]{2,30}|第[二2]件[^！!。，\n]{2,25}|仅需[^！!。，\n]{1,15}|只需[^！!。，\n]{1,15})/g)?.slice(0, 3) || [];
  const product = hashtags.find(tag => /粮|罐|猫|狗|宠|零食|用品/.test(tag)) || data.title || "该宠物商品";
  const promoText = promo.length ? promo.join("；") : "原文没有清晰、可验证的优惠数字";

  return `## 视频内容复述
这条视频在推广 **${product}**。核心内容不是知识分享，而是用“${promoText}”推动用户立即下单。原文主要表达为：

> “${excerpt}${content.length > 90 ? "…" : ""}”

## 爆款钩子
原文最强钩子是“${promoText}”。它利用价格反差制造停留，但缺少宠物画面和痛点铺垫。建议把优惠放在宠物真实反应之后，先用“养宠人正在遇到的问题”扩大受众。

## 情绪点
主要情绪是“捡到便宜的惊喜感”和“限时活动的紧迫感”。目前缺少养宠人的共鸣情绪，可补充挑食、囤粮快、怕买错等真实焦虑，再用试吃结果释放情绪。

## 内容结构
当前结构是：商品活动 → 优惠数字 → 搜索指令。建议升级为：3秒痛点 → 商品实拍 → 宠物反馈 → 卖点证据 → 优惠信息 → 单一行动指令。

## 带货卖点
原文明确卖点：${promoText}。缺少产品层卖点，例如颗粒、配料、适口性或使用过程。价格卖点负责促单，产品证据负责建立信任，两者不能只留一个。

## 转化话术
建议使用：“本来就需要${product}的，可以先看商品页当前活动和详细信息，确认适合自家宠物再下单。”避免把平台自动生成的“复制链接打开抖音”直接当口播。

## 原文逐段拆解
**1. 商品与活动信息**
- 商品线索：${product}
- 优惠机制：${promoText}
- 话题标签：${hashtags.length ? hashtags.map(tag => `#${tag}`).join("、") : "未提取到有效标签"}

**2. 当前开头**
原文直接从活动信息切入。优点是价格明确、转化直接；问题是只对已经想买的人有效，没有先让普通养宠用户产生“这和我有关”的感觉。

**3. 中段内容**
当前文案几乎全部是促销说明，没有展示狗粮颗粒、配料信息、适口性、狗狗试吃反应或喂食场景。用户知道“便宜”，但还不知道“为什么值得买”。

**4. 结尾动作**
“复制链接、打开抖音搜索”属于平台分享附带文字，不应直接当作视频口播。真正的视频结尾需要给出单一、自然的购买理由和行动指令。

## 爆款要素判断
- **价格冲击：强** — ${promoText}
- **宠物真实反应：缺失** — 没有试吃、追食或饭后状态镜头
- **信任证据：缺失** — 没有配料表、颗粒大小、生产信息等特写
- **痛点共鸣：较弱** — 没有点出挑食、囤粮成本或多宠家庭消耗快
- **内容节奏：过短** — 只有“促销”，缺少“问题 → 实测 → 结果 → 优惠”

## 建议重拍结构
**0–3秒｜痛点钩子**
画面：狗狗守在饭盆旁，主人展示快见底的粮袋。
口播：“家里有个干饭狗的都懂，狗粮不是吃不起，是根本囤不住。”

**4–10秒｜商品实拍**
画面：倒出${product}，拍颗粒大小和包装信息。
口播：“我最近给它吃的是这款，先别看活动，给你们看颗粒和它的真实反应。”

**11–20秒｜宠物反馈**
画面：狗狗闻、吃、舔碗的连续镜头。
口播：“刚倒进碗就开始吃，适口性至少在我家这只身上过关。买粮前也记得根据自家狗狗情况看配料信息。”

**21–28秒｜优惠转化**
画面：活动页面与两件商品同框。
口播：“现在${promoText}。本来就要囤粮的可以算一下单斤价格，合适再入。”

**29–32秒｜行动指令**
口播：“活动规则可能变化，点商品页先确认当前价格。”

## 可直接使用的标题
1. 养一只干饭狗，终于知道狗粮为什么要囤
2. ${product}真实试吃，活动便宜但先看它吃不吃
3. 买两件到底划不划算？先算完单斤价格再下单

## 合规提醒
不要把单只宠物的试吃结果说成普遍效果；优惠价格要以商品页实时规则为准；不要使用“最好、第一、百分百”等绝对化表达。`;
}

function buildAnalyzeDemo(data) {
  const raw = (data.content || "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const excerpt = raw.slice(0, 80) || "未提供有效文案";
  const tags = [...raw.matchAll(/#\s*([^#\s]+)/g)].map(match => match[1]);
  const promo = raw.match(/(买[^！!。，\n]{2,30}|第[二2]件[^！!。，\n]{2,25}|仅需[^！!。，\n]{1,15}|只需[^！!。，\n]{1,15})/g)?.join("；") || "未发现明确优惠信息";
  const category = tags.find(tag => /粮/.test(tag)) ? "宠物食品" : tags.find(tag => /砂/.test(tag)) ? "猫砂" : tags.find(tag => /除臭|清洁/.test(tag)) ? "除臭清洁" : "宠物用品";
  return JSON.stringify({
    hook: `原文以“${promo}”作为主要钩子，价格信息直接，但缺少宠物真实反应。建议先用养宠痛点或结果镜头吸引停留，再公布活动。原文片段：“${excerpt}”`,
    emotion: "主要情绪是优惠带来的惊喜感和限时紧迫感。可补充挑食、囤货成本、怕买错等真实焦虑，再用宠物试用结果释放情绪。",
    structure: "当前结构：活动信息 → 优惠数字 → 搜索指令。建议结构：0–3秒痛点钩子 → 商品实拍 → 宠物反馈 → 卖点证据 → 优惠信息 → 单一行动指令。",
    selling_points: `已识别的促销卖点：${promo}。产品层卖点不足，建议补充配料或材质、实物细节、使用过程和宠物反馈，避免只讲价格。`,
    closing: "建议话术：本来就需要这类商品的，可以先看商品页当前活动和详细信息，确认适合自家宠物再下单。优惠规则以页面实时信息为准。",
    category,
  }, null, 2);
}

function buildScriptDemo(data) {
  const product = data.product || "宠物商品";
  const selling = data.selling || "使用方便";
  const pet = data.pet || "宠物";
  const isCat = /猫/.test(`${product}${pet}`);
  const isSnackBundle = /零食|罐头|餐包|礼包|组合|猫条|妙鲜包/.test(`${product}${selling}`);
  const isFood = /粮|主食|冻干|鲜肉|适口|鸡肉|牛肉|鱼肉|鸭肉|营养|蛋白/.test(`${product}${selling}`);
  const isLitter = /猫砂|结团|粉尘|粘底|带砂|豆腐砂|矿砂/.test(`${product}${selling}`);
  const isWater = /饮水|水碗|喝水|活水|过滤|水机/.test(`${product}${selling}`);
  const isGrooming = /梳|毛|清洁|洗护|除臭|湿巾|指甲|牙膏/.test(`${product}${selling}`);
  const isToy = /玩具|逗猫|磨牙|漏食|球|猫抓/.test(`${product}${selling}`);

  if (isCat && isSnackBundle) {
    return `## 版本一｜开箱试吃型
### 0–3秒｜开头钩子
**画面：** 礼包全部倒在桌上，猫咪闻到味道后靠近。
**口播：** “这一整套猫零食组合，主食餐包和猫罐头都有，我家猫最后会先选哪个？”
**字幕：** 猫零食组合礼包真实开箱

### 4–9秒｜组合展示
**画面：** 依次拿起两包主食餐包和一罐猫罐头，拍清包装名称。
**口播：** “这个组合里是${selling}，不是只塞同一种口味，先把每样实物给你们看清楚。”
**字幕：** 2包主食餐包＋1个猫罐头

### 10–20秒｜真实试吃
**画面：** 分别取少量放入三个小碟，让猫咪自由选择，连续记录闻、舔、吃。
**口播：** “我每样只放一点，不引导它。它先闻了餐包，又转头吃罐头，最后选的是这个口味。”
**字幕：** 不剪第一选择｜仅代表我家猫

### 21–26秒｜购买理由
**画面：** 猫咪继续进食，镜头切回组合全家福。
**口播：** “这种组合对第一次尝试比较友好，能先看猫咪喜欢哪种，再决定以后买什么。”
**字幕：** 多口味尝试｜减少盲买

### 27–30秒｜结尾转化
**口播：** “想看每款配料和当前组合价格的，点商品页自己对比，按自家猫饮食习惯选择。”
**字幕：** 零食适量｜主食属性看包装

## 版本二｜猫咪选妃剧情型
### 0–3秒｜开头钩子
**画面：** 三款产品排成一排，猫咪坐在后面。
**口播：** “今天让主子自己选，餐包一号、餐包二号、罐头三号，谁能留下？”
**字幕：** 猫咪零食选妃现场

### 4–9秒｜选手介绍
**画面：** 快节奏展示每款包装和内容物。
**口播：** “一号是主食餐包，二号换了个口味，三号是猫罐头，都是这次组合里的。”
**字幕：** ${selling}

### 10–21秒｜宠物反应
**画面：** 猫咪依次试闻，给第一选择、回头复吃和舔嘴特写。
**口播：** “它先跳过一号，二号闻了两秒，结果对三号直接开吃。等一下，它又回去找二号了。”
**字幕：** 第一选择：三号｜第二选择：二号

### 22–27秒｜卖点植入
**画面：** 产品组合和剩余量同框。
**口播：** “组合装的好处就是一次能试不同类型，不用第一次就囤一整箱同口味。”
**字幕：** 组合尝鲜更直观

### 28–30秒｜结尾转化
**口播：** “你家猫会选几号？想试的先看详情和喂食建议。”
**字幕：** 评论区猜猜它的最爱

## 版本三｜新手避坑型
### 0–3秒｜开头钩子
**画面：** 拿着组合礼包，旁边放一袋吃不完的旧零食。
**口播：** “新手给猫买零食，最怕的不是贵，是整箱买回家它一口不吃。”
**字幕：** 猫零食别一上来就囤箱

### 4–10秒｜痛点共鸣
**画面：** 展示旧零食剩余，再切到本次小组合。
**口播：** “猫的口味真的很难猜，所以我现在更愿意先买这种有餐包、有罐头的小组合。”
**字幕：** 先尝鲜｜再决定回购

### 11–21秒｜内容物实拍
**画面：** 撕开餐包、打开罐头，分别拍质地和实际分量。
**口播：** “这套是${selling}。质地和分量都拍给你们看，具体是不是主食、怎么喂，要以包装标注为准。”
**字幕：** 实物质地｜实际分量

### 22–27秒｜试吃结论
**画面：** 猫咪试吃，主人记录最喜欢的口味。
**口播：** “我家猫这次更喜欢罐头，餐包也愿意吃。以后回购至少有方向，不用靠猜。”
**字幕：** 真实反馈仅代表本猫

### 28–30秒｜结尾转化
**口播：** “想给猫尝新的，可以先看组合内容和配料，适合再入。”
**字幕：** 零食控制喂食量

## 发布文案
猫零食组合礼包真实开箱：两包主食餐包加一个猫罐头，让猫咪自己选。每只猫口味不同，配料和主食属性以包装为准。#猫零食 #猫罐头 #养猫好物`;
  }

  if (isFood) {
    return `## 版本一｜真实试吃测评
### 开头3秒钩子
“狗粮好不好吃，别听我说，直接看我家这只挑嘴狗的反应。”

### 中段种草逻辑
先展示${product}包装，再拍干粮与冻干颗粒实物，最后完整记录狗狗闻、吃和停顿的真实过程。

### 产品卖点植入
“这款主打${selling}，我先给你们看实物。第一次吃没有拌其他东西，换粮记得循序渐进。”

### 结尾转化话术
“想看配料和当前价格的，点商品页自己对比，适合自家狗再下单。”

## 版本二｜挑食痛点型
### 开头3秒钩子
“给挑食狗换粮最怕什么？买一大袋，闻完一口不吃。”

### 中段种草逻辑
展示旧粮剩在碗里的场景，再开袋拍${product}，用同一饭碗做一次不加诱食剂的试吃记录。

### 产品卖点植入
“我看中的是${selling}。颗粒大小和冻干比例都拍清楚，适口性只看我家狗的真实反馈。”

### 结尾转化话术
“挑食狗建议先试合适规格，别盲目囤大袋。商品信息放在页面里了。”

## 版本三｜性价比囤粮型
### 开头3秒钩子
“养一只干饭狗才知道，狗粮不是贵，是消耗得太快。”

### 中段种草逻辑
先展示一周消耗量，再计算单餐成本，穿插狗狗进食和包装信息镜头。

### 产品卖点植入
“${product}主打${selling}。我更关心它愿不愿意吃，以及按每天喂食量算下来是否合适。”

### 结尾转化话术
“正在囤粮的先看当前活动，再按自家狗体重算用量，合适再买。”

## 商品识别
- 商品：${product}
- 类别：宠物食品 / 狗粮
- 核心卖点：${selling}

## 自动识别的人群与痛点
${data.audience || `目标人群：关注狗狗适口性、日常喂养体验和囤粮成本的铲屎官。核心痛点：担心狗狗挑食，不确定干粮和冻干搭配是否愿意吃，购买前缺少真实试吃参考。`}

## 合规提醒
不要承诺治病、改善泪痕或保证所有狗狗都爱吃；“鲜肉、冻干”等信息应以包装配料表为准。`;
  }

  if (isLitter) {
    return `## 版本一｜三项真实测试
### 0–3秒｜开头钩子
**画面：** 铲子铲起完整猫砂团，倒过来轻晃。
**口播：** “猫砂别只看便宜，这三项有一项不过关，我都不会回购。”
**字幕：** 猫砂实测｜结团·粉尘·粘底

### 4–10秒｜结团测试
**画面：** 往猫砂中倒入等量清水，计时后用铲子铲起。
**口播：** “第一看结团。我倒入同样的水，等十秒再铲，这款成团比较完整，铲的时候没有散一盆。”
**字幕：** 统一水量｜10秒后开铲

### 11–17秒｜粉尘测试
**画面：** 从固定高度缓慢倒砂，用深色背景拍扬尘。
**口播：** “第二看粉尘。直接倒给你们看，镜头不加滤镜，实际扬尘情况就是这样。”
**字幕：** 深色背景实拍

### 18–24秒｜粘底测试
**画面：** 铲起盆底结团，展示盆底残留。
**口播：** “第三看粘底。铲完盆底没有糊住，日常清理不用一直刮，这点对我最实用。”
**字幕：** 盆底残留实拍

### 25–30秒｜结尾转化
**画面：** 猫咪进入猫砂盆，产品包装放在侧后方。
**口播：** “${product}主打${selling}。这是我家真实测试，想看规格和当前价格的点商品页，适合自家猫再选。”
**字幕：** 使用感受因猫和猫砂盆而异

## 版本二｜铲屎崩溃痛点
### 0–3秒｜开头钩子
**画面：** 展示粘在盆底、铲碎的旧猫砂。
**口播：** “每天铲屎最崩溃的不是臭，是一铲就碎、盆底还粘得死死的。”
**字幕：** 铲屎官每天都懂

### 4–9秒｜放大问题
**画面：** 连续展示碎团、扬尘和盆边带砂。
**口播：** “碎团清不干净，下一次味道更明显；倒砂还扬灰，猫一出来又带得到处都是。”
**字幕：** 碎团｜扬尘｜粘底

### 10–20秒｜解决过程
**画面：** 换上${product}，依次完成倒水、计时、铲团。
**口播：** “我换这款主要看中${selling}。同样的水量，等十秒再铲，团能完整起来，盆底也更好清理。”
**字幕：** 同条件测试更直观

### 21–26秒｜日常体验
**画面：** 正常铲砂并装袋，拍清理后的猫砂盆。
**口播：** “对我来说，猫砂不用说得多神，能让我每天少刮几下盆、少收拾一点就够了。”
**字幕：** 日常省事才是真卖点

### 27–30秒｜结尾转化
**口播：** “有同样困扰的，可以先看商品详情和规格，根据猫咪习惯选择。”
**字幕：** 按猫咪习惯选择

## 版本三｜反常识避坑
### 0–3秒｜开头钩子
**画面：** 三款猫砂包装快速闪过，最后停在测试盆。
**口播：** “猫砂不是结团越快越好，很多人漏看了后面这两点。”
**字幕：** 新手选猫砂别只看结团

### 4–10秒｜误区一
**画面：** 铲起表面结团，再展示底部残留。
**口播：** “表面看着成团快，但如果容易粘底，铲一次要刮半天，体验还是很差。”
**字幕：** 结团完整 ≠ 一定不粘底

### 11–17秒｜误区二
**画面：** 倒砂时用侧光拍粉尘。
**口播：** “第二别只闻香不香，还要看倒砂时的粉尘，以及猫咪愿不愿意正常使用。”
**字幕：** 粉尘与猫咪接受度更重要

### 18–25秒｜商品实测
**画面：** ${product}倒砂、结团、铲起三个镜头连续呈现。
**口播：** “这款主打${selling}。我把结团、倒砂和盆底情况都拍出来，不只给你们看包装。”
**字幕：** 真实测试｜不替所有猫下结论

### 26–30秒｜结尾转化
**口播：** “第一次换砂建议逐步混砂过渡，想看容量和规格的去商品页对比。”
**字幕：** 换砂建议循序渐进

## 发布文案
猫砂不只看结团，粉尘、粘底和猫咪接受度都要一起看。三项真实测试拍给你，结果仅代表本次使用。#猫砂测评 #养猫避坑 #铲屎官日常`;
  }

  const category = isWater ? "宠物饮水用品" : isGrooming ? "宠物清洁护理用品" : isToy ? "宠物玩具" : "宠物用品";
  const action = isWater ? "主动靠近并使用" : isGrooming ? "实际护理前后对比" : isToy ? "看到商品后的互动反应" : "第一次真实使用";
  return `## 版本一｜真实体验型
### 开头3秒钩子
“买之前我也怕闲置，结果${pet}的反应比我想得直接。”
### 中段种草逻辑
展示旧方案的麻烦，再完整拍摄${product}第一次真实使用。
### 产品卖点植入
“它主打${selling}，实际操作给你们看，不只拍包装。”
### 结尾转化话术
“这是我家真实使用情况，需要的先看详情，适合自己再入。”

## 版本二｜痛点解决型
### 开头3秒钩子
“养${pet}以后，这个小麻烦每天都在重复。”
### 中段种草逻辑
放大使用前的问题，展示产品操作过程和前后变化。
### 产品卖点植入
“${product}的${selling}，正好解决了我最在意的使用问题。”
### 结尾转化话术
“有同样困扰的可以先看商品详情，按自己场景选择。”

## 版本三｜宠物反应型
### 开头3秒钩子
“我没想到，最先接受这个东西的居然是它。”
### 中段种草逻辑
以宠物第一次接触、试探和正式使用的反应推进剧情。
### 产品卖点植入
“比参数更直观的是它愿意用，${selling}也是我留下它的原因。”
### 结尾转化话术
“想看完整使用细节的，商品页里有信息，确认合适再买。”

## 商品识别
- 商品：${product}
- 类别：${category}
- 核心卖点：${selling}

## 自动识别的人群与痛点
${data.audience || `目标人群：正在为${pet}挑选实用好物的铲屎官。核心痛点：不知道商品是否好用，也担心宠物不愿配合。`}

## 标题
${product}到底值不值？直接看${pet}的真实反应

## 拍摄准备
商品：${product}｜场景：日常使用位置｜道具：使用前的旧方案

## 分镜脚本
**0–3秒｜结果钩子**
画面：展示${pet}${action}。
台词：“买之前我也怕闲置，结果它的反应比我想得直接。”

**4–10秒｜原有痛点**
画面：展示使用前遇到的具体麻烦。
台词：“以前最麻烦的是不好用、难维护，还不知道它愿不愿意配合。”

**11–22秒｜卖点实测**
画面：完整展示${product}的使用过程和细节。
台词：“它主打${selling}，实际操作给你们看，不只拍包装。”

**23–30秒｜结论与行动**
画面：商品与宠物同框。
台词：“这是我家真实使用情况，需要的先看详情，适合自己再入。”

## 发布文案
${product}真实体验，不只说卖点，也看宠物愿不愿意用。#宠物用品 #养宠好物`;
}

const creativeTemplates = [
  { title:"结果前置", pet:"通用", category:"通用", hook:"先展示最意外的使用结果，再解释过程。", emotion:"惊讶与好奇", structure:"结果钩子 → 使用前问题 → 真实过程 → 结果复现", selling_points:"用可见结果承接卖点", closing:"让用户按自身需求查看详情" },
  { title:"反常识避坑", pet:"通用", category:"通用", hook:"指出用户最容易忽略或做错的一件事。", emotion:"轻度焦虑与获得感", structure:"错误认知 → 真实测试 → 正确选择 → 避坑总结", selling_points:"卖点作为正确方案出现", closing:"先确认适用条件再选择" },
  { title:"宠物第一反应", pet:"通用", category:"通用", hook:"不介绍商品，先记录宠物第一次接触的反应。", emotion:"期待与真实感", structure:"宠物反应 → 商品揭晓 → 细节实拍 → 主人结论", selling_points:"用宠物行为证明接受度", closing:"强调个体差异，理性选择" },
  { title:"同价对比", pet:"通用", category:"通用", hook:"同样预算，两种选择到底差在哪里？", emotion:"怕买错与确定感", structure:"价格锚点 → 三项对比 → 使用反馈 → 选择建议", selling_points:"用统一条件突出差异", closing:"建议用户自行比较规格" },
  { title:"一天真实记录", pet:"通用", category:"通用", hook:"把商品放进真实养宠一天，不单独拍广告。", emotion:"陪伴与生活感", structure:"早晨问题 → 白天使用 → 晚上结果 → 一天总结", selling_points:"在自然场景中反复露出", closing:"适合相同生活场景的人群" },
  { title:"限时挑战", pet:"通用", category:"通用", hook:"设定10秒、10分钟或7天挑战目标。", emotion:"悬念与结果满足", structure:"挑战规则 → 计时过程 → 意外节点 → 结果公布", selling_points:"通过挑战过程展示性能", closing:"邀请用户评论预测结果" },
];

function randomIndex(max) {
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function matchTemplates(data) {
  const text = `${data.product || ""} ${data.selling || ""} ${data.pet || ""}`;
  const categoryRules = [
    ["猫粮", /猫粮|冻干|主食|罐头|猫咪.*粮/],
    ["猫砂", /猫砂|结团|粉尘|粘底|豆腐砂|矿砂/],
    ["除臭", /除臭|去味|异味|清洁|喷雾/],
    ["玩具", /玩具|逗猫|磨牙|漏食|猫抓|放电/],
  ];
  const matchedCategory = categoryRules.find(([, rule]) => rule.test(text))?.[0];
  const categoryPool = templates.filter(template =>
    (!matchedCategory || template.category === matchedCategory) &&
    (template.pet === data.pet || template.pet === "通用" || data.pet === "猫狗通用")
  );
  const primary = shuffled(categoryPool).slice(0, 2);
  const creative = shuffled(creativeTemplates).slice(0, 1);
  return shuffled([...primary, ...creative]);
}

function templateContext(items) {
  return items.map((item, index) => `模板${index + 1}【${item.title}】
钩子：${item.hook}
情绪：${item.emotion}
结构：${item.structure}
卖点表达：${item.selling_points}
收口：${item.closing}`).join("\n\n");
}

function enforceContentConsistency(type, data, original) {
  if (type !== "script") return { content: original, corrected: false };
  let content = original;
  const source = `${data.product || ""} ${data.selling || ""} ${data.pet || ""}`;
  const replacements = [];
  if (/猫/.test(source) && !/猫狗通用/.test(data.pet)) {
    replacements.push(
      [/挑嘴狗|狗狗|小狗|犬只/g, "猫咪"],
      [/狗粮/g, /零食|罐头|餐包|礼包|组合/.test(source) ? "猫零食组合" : "猫粮"],
      [/遛狗/g, "陪猫互动"],
      [/狗体重/g, "猫咪体重"],
      [/犬用/g, "猫用"],
    );
  }
  if (/狗/.test(source) && !/猫狗通用/.test(data.pet)) {
    replacements.push(
      [/猫咪|小猫/g, "狗狗"],
      [/猫粮/g, "狗粮"],
      [/逗猫/g, "陪狗互动"],
    );
  }
  if (!/饮水|水碗|喝水|水机/.test(source)) {
    replacements.push([/智能饮水机|宠物饮水机|旧水碗/g, data.product || "当前商品"]);
  }
  for (const [pattern, replacement] of replacements) content = content.replace(pattern, replacement);
  if (data.product && !content.includes(data.product)) {
    content = `## 当前商品\n${data.product}\n\n${content}`;
  }
  return { content, corrected: content !== original };
}

function randomizeRuleVersions(content) {
  const versions = content.match(/## 版本[一二三][\s\S]*?(?=## 版本[一二三]|## 发布文案|$)/g);
  if (!versions || versions.length < 2) return content;
  const suffix = content.match(/## 发布文案[\s\S]*$/)?.[0] || "";
  const labels = ["一", "二", "三"];
  return shuffled(versions).map((section, index) =>
    section.replace(/^## 版本[一二三]/, `## 版本${labels[index]}`)
  ).join("\n\n") + (suffix ? `\n\n${suffix}` : "");
}

function toolPage(type) {
  const latest = state.history.find(item => item.type === type);
  state.currentResult = latest?.content || "";
  state.currentResultDate = latest?.date || null;
  const configs = {
    analyze: {
      kicker: "看懂画面与文案，才能复制爆款", title: "爆款视频拆解", desc: "上传视频可识别关键画面；仅粘贴分享链接时只能分析其中的文字。",
      fields: `<label class="field"><span>上传视频（推荐）</span><div class="file-drop"><input type="file" name="video" accept="video/mp4,video/quicktime,video/webm"><b>＋ 选择本地视频</b><small>提取关键帧 + 识别口播 · 完整分析需小于 25MB</small></div></label>
      <div class="video-note">抖音分享链接无法直接读取视频画面。请先将视频保存到本机，再上传分析。</div>` +
      field("视频标题（可选）", "title", "例如：猫咪不喝水怎么办？", "input", [], false) +
      field("分享文案 / 口播内容（可选）", "content", "可粘贴口播、字幕或抖音分享文字；上传视频与文案至少提供一项", "textarea", [], false) +
      field("视频数据（可选）", "stats", "例如：播放量120万，点赞8.6万，评论3200", "input", [], false),
      button: "分析视频与文案", prompt: d => `请结合上传视频的关键帧与原文拆解宠物短视频。标题：${d.title || "未提供"}；数据：${d.stats || "未提供"}；原文：${d.content || "未提供"}；视频文件：${d.video_name || "未上传"}。如果有关键帧，必须描述具体画面、宠物动作、商品露出、字幕和镜头变化；不要只分析标题。只返回合法 JSON，不要代码围栏。结构：{"hook":"","emotion":"","structure":"","selling_points":"","closing":"","category":""}。`,
      demo: buildAnalyzeDemo,
    },
    script: {
      kicker: "一次生成三种角度，快速测试转化", title: "宠物商品脚本生成", desc: "输入商品名称，一键获得 3 个不同创意方向的完整短视频脚本。",
      fields: field("产品名称", "product", "例如：猫粮 / 除臭喷雾 / 猫砂") + field("目标人群（可选）", "audience", "例如：第一次养猫的新手铲屎官；留空由 AI 自动识别", "input", [], false) + `<div class="form-row">${field("宠物类型", "pet", "", "select", ["猫咪","狗狗","猫狗通用","其他"])}${field("视频时长", "duration", "", "select", ["30秒","45秒","60秒"])}</div>` + field("核心卖点（可简写）", "selling", "例如：鲜肉冻干、结团快、植物除臭；不清楚可填写“自动分析”", "textarea"),
      button: "一键生成 3 个版本", prompt: d => `为${d.product}生成3个差异明显的${d.duration}抖音带货脚本。宠物：${d.pet}；卖点：${d.selling}；${d.audience ? `目标人群：${d.audience}` : "请自动识别目标人群"}。每个版本都必须完整包含“开头3秒钩子、中段种草逻辑、产品卖点植入、结尾转化话术”，三个版本分别采用真实测评、痛点解决、情绪/剧情角度。`,
      demo: buildScriptDemo,
    },
    persona: {
      kicker: "从现有内容里，找到最清晰的账号记忆点", title: "宠物账号人设分析", desc: "填写账号简介，或粘贴 3–5 条视频文案，AI 将识别人设与带货方向。",
      fields: field("账号简介（与视频文案至少填写一项）", "bio", "例如：两猫一狗的打工人，分享真实养宠日常", "textarea", [], false) + field("3–5 条视频文案", "scripts", "每条文案之间空一行；内容越完整，判断越准确", "textarea", [], false),
      button: "分析账号人设", prompt: d => `根据账号简介和视频文案分析宠物账号。简介：${d.bio || "未提供"}；文案：${d.scripts || "未提供"}。必须输出“人设类型（治愈型/测评型/剧情型等）、内容风格、核心标签3-5个、适合带货品类、优化建议”。结论必须引用输入中的内容证据。`,
      demo: d => `## 人设类型\n**真实测评型 + 日常陪伴型**\n依据：${(d.bio || d.scripts || "现有内容").slice(0, 100)}\n\n## 内容风格\n生活化、口语化，以宠物真实反应和主人体验建立信任。适合减少硬广表达，多用“使用前问题—真实过程—宠物反馈”的内容结构。\n\n## 核心标签\n- 真实养宠\n- 新手避坑\n- 宠物好物实测\n- 铲屎官日常\n- 理性消费\n\n## 适合带货品类\n猫粮/狗粮、猫砂、除臭清洁、日常玩具、饮水与喂食用品。优先选择能现场展示、能拍宠物反应的商品。\n\n## 优化建议\n1. 简介增加一句固定记忆点，明确宠物数量或性格。\n2. 每周固定一个测评栏目，统一封面和开场句。\n3. 带货内容先展示问题和真实使用，再讲卖点。\n4. 连续发布同一主题3–5条，避免定位频繁变化。`,
    },
  };
  const c = configs[type];
  return `${pageIntro(c.kicker,c.title,c.desc)}
    <div class="tool-layout">
      <form class="tool-form" data-tool="${type}"><div class="form-card"><div class="form-title"><span>1</span><div><h3>填写基础信息</h3><p>信息越具体，生成结果越贴合</p></div></div>${c.fields}
      <button class="btn primary full" type="submit">${icons.sparkle} ${c.button}</button></div></form>
      <div class="result-card"><div class="result-head"><div><span>2</span><div><h3>AI 生成结果</h3><p>支持编辑、保存和复制</p></div></div><div class="result-actions"><button class="copy-btn" data-action="edit-result" ${latest ? "" : "hidden"}>✎ 编辑</button><button class="copy-btn" data-action="copy" ${latest ? "" : "hidden"}>${icons.copy} 复制</button></div></div>
      <div class="result-empty" ${latest ? "hidden" : ""}><div class="empty-orbit">${icons.sparkle}</div><h3>你的专属内容将在这里生成</h3><p>填写左侧信息，点击按钮开始创作</p></div>
      <textarea class="result-editor" hidden aria-label="编辑生成结果"></textarea>
      <article class="result-content" ${latest ? "" : "hidden"}>${latest ? `<div class="restored-tag">已恢复最近一次生成结果 · ${formatDate(latest.date)}</div>${renderGeneratedContent(type, latest.content)}` : ""}</article></div>
    </div>`;
}

function templatesPage() {
  const cats = ["全部", ...new Set(templates.map(t => t.category))];
  const visible = state.templateFilter === "全部" ? templates : templates.filter(t => t.category === state.templateFilter);
  return `${pageIntro("验证过的结构，拿来就能拍","爆款视频模板库","精选宠物赛道高复用内容结构，降低创作门槛。")}
    <div class="filter-row">${cats.map(c => `<button data-filter="${c}" class="${state.templateFilter === c ? "active" : ""}">${c}</button>`).join("")}</div>
    <div class="template-grid">${visible.map(t => `<article class="template-card" data-template="${t.id}"><div class="template-cover ${t.color}"><span>${t.badge}</span><div>${t.pet === "狗狗" ? "🐶" : t.pet === "猫咪" ? "🐱" : "🐾"}</div><small>${t.duration}</small></div><div class="template-body"><div class="meta">${t.category} · ${t.pet}</div><h3>${t.title}</h3><p>${t.desc}</p><button>查看模板 <b>→</b></button></div></article>`).join("")}</div>`;
}

function libraryPage() {
  const cats = ["全部", ...copyLibrary.categories.map(item => item.name)];
  const visible = state.libraryFilter === "全部" ? copyLibrary.scripts : copyLibrary.scripts.filter(item => item.category === state.libraryFilter);
  return `${pageIntro("9 个品类 · 540 条可直接拍","宠物带货文案库","每个品类 60 条 JSON 结构化脚本，支持筛选、查看、复制和载入生成器。")}
    <div class="library-summary">当前显示 <b>${visible.length}</b> 条 · 全库共 ${copyLibrary.total} 条</div>
    <div class="filter-row">${cats.map(c => `<button data-library-filter="${c}" class="${state.libraryFilter === c ? "active" : ""}">${c}</button>`).join("")}</div>
    <div class="template-grid">${visible.map(item => `<article class="template-card" data-library-id="${item.id}">
      <div class="template-cover ${["purple","orange","green","blue","red","pink"][Number(item.id.slice(-2)) % 6]}"><span>${item.angle}</span><div>${item.pet === "狗狗" ? "🐶" : item.pet === "猫咪" ? "🐱" : "🐾"}</div><small>${item.duration}</small></div>
      <div class="template-body"><div class="meta">${item.category} · ${item.id}</div><h3>${item.title}</h3><p>${item.hook}</p><button>查看完整脚本 <b>→</b></button></div>
    </article>`).join("")}</div>`;
}

const typeNames = { analyze: "爆款视频拆解", script: "商品脚本", persona: "账号人设分析" };

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(timestamp));
}

function historyPage() {
  return `${pageIntro("灵感不会丢失，随时回来继续","历史生成记录","自动保存最近 20 次生成内容，数据仅保存在当前浏览器。")}
    <div class="history-toolbar"><div><b>共 ${state.history.length} 条记录</b><span>点击记录可查看完整内容</span></div>
    ${state.history.length ? `<button class="clear-history" data-action="clear-history">清空全部</button>` : ""}</div>
    ${state.history.length ? `<div class="history-list">${state.history.map((item, index) => {
      const summary = item.input?.product || item.input?.title || item.input?.pet || item.input?.content || "未命名内容";
      return `<article class="history-item" data-history-index="${index}">
        <div class="history-type ${item.type}">${item.type === "script" ? "✦" : item.type === "analyze" ? "⌁" : "◎"}</div>
        <div class="history-main"><div class="history-meta"><span>${typeNames[item.type] || "AI 生成"}</span><time>${formatDate(item.date)}</time></div>
        <h3>${escapeHtml(String(summary).slice(0, 48))}</h3><p>${escapeHtml(item.content.replace(/[#*\n]/g, " ").slice(0, 110))}…</p></div>
        <button class="history-delete" data-delete-history="${index}" title="删除">×</button><b class="history-arrow">→</b>
      </article>`;
    }).join("")}</div>` : `<div class="history-empty"><div class="empty-orbit">${icons.sparkle}</div><h3>还没有生成记录</h3><p>使用任意 AI 工具生成内容后，会自动保存在这里。</p><a href="${pageUrls.script}" class="btn primary">去生成第一条脚本</a></div>`}`;
}

function render() {
  const pages = { home: homePage, script: () => toolPage("script"), library: libraryPage, persona: () => toolPage("persona"), templates: templatesPage, history: historyPage };
  app.innerHTML = shell((pages[state.page] || homePage)());
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-action='settings']").forEach(b => b.onclick = showSettings);
  document.querySelector("[data-action='copy']")?.addEventListener("click", copyResult);
  document.querySelector("[data-action='edit-result']")?.addEventListener("click", toggleResultEditor);
  document.querySelector(".tool-form")?.addEventListener("submit", handleGenerate);
  document.querySelectorAll("[data-filter]").forEach(b => b.onclick = () => { state.templateFilter = b.dataset.filter; render(); });
  document.querySelectorAll("[data-library-filter]").forEach(b => b.onclick = () => { state.libraryFilter = b.dataset.libraryFilter; render(); });
  document.querySelectorAll("[data-library-id]").forEach(card => card.onclick = () => showLibraryScript(card.dataset.libraryId));
  document.querySelectorAll("[data-template]").forEach(card => card.onclick = () => showTemplate(Number(card.dataset.template)));
  document.querySelectorAll("[data-history-index]").forEach(card => card.onclick = () => showHistory(Number(card.dataset.historyIndex)));
  document.querySelectorAll("[data-delete-history]").forEach(button => button.onclick = event => {
    event.stopPropagation();
    state.history.splice(Number(button.dataset.deleteHistory), 1);
    save("history", state.history);
    render();
    toast("记录已删除");
  });
  document.querySelector("[data-action='clear-history']")?.addEventListener("click", clearHistory);
  const videoInput = document.querySelector('input[name="video"]');
  videoInput?.addEventListener("change", () => {
    const label = document.querySelector(".file-drop b");
    if (videoInput.files[0]) label.textContent = `✓ ${videoInput.files[0].name}`;
  });
  if (state.page === "script") {
    const selected = load("selected-template", null);
    if (selected) {
      const productInput = document.querySelector('input[name="product"]');
      const sellingInput = document.querySelector('textarea[name="selling"]');
      if (productInput) productInput.value = selected.category || "";
      if (sellingInput) sellingInput.value = selected.selling_points || "";
      remove("selected-template");
      toast(`已载入“${selected.title}”模板`);
    }
  }
}

async function extractVideoFrames(file) {
  if (!file) return [];
  if (file.size > 100 * 1024 * 1024) throw new Error("视频超过 100MB，请压缩或截取后再上传");
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = url;
  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = () => reject(new Error("无法读取该视频，请使用 MP4、MOV 或 WebM 格式"));
    });
    const canvas = document.createElement("canvas");
    const maxWidth = 720;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    const frames = [];
    for (const ratio of [0.08, 0.35, 0.65, 0.9]) {
      video.currentTime = Math.min(video.duration - 0.05, Math.max(0, video.duration * ratio));
      await new Promise((resolve, reject) => {
        video.onseeked = resolve;
        video.onerror = () => reject(new Error("视频关键帧提取失败"));
      });
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.7));
    }
    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function handleGenerate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const type = form.dataset.tool;
  const videoFile = type === "analyze" ? form.querySelector('input[name="video"]')?.files[0] : null;
  if (type === "analyze" && !videoFile && !data.content?.trim()) {
    toast("请上传本地视频，或粘贴视频文案", true);
    return;
  }
  delete data.video;
  if (videoFile) data.video_name = videoFile.name;
  if (type === "persona" && !data.bio?.trim() && !data.scripts?.trim()) {
    toast("请填写账号简介，或粘贴 3–5 条视频文案", true);
    return;
  }
  if (type === "script") {
    const matched = matchTemplates(data);
    data.matched_templates = matched.map(item => item.title);
    data.template_context = templateContext(matched);
    data.creative_seed = `${Date.now()}-${randomIndex(100000)}`;
  }
  const configMap = {
    analyze: [d => `拆解短视频：${d.content}`, d => toolPage],
  };
  const button = form.querySelector("button[type=submit]");
  const result = document.querySelector(".result-content");
  const empty = document.querySelector(".result-empty");
  button.disabled = true; button.innerHTML = `<span class="spinner"></span> AI 正在创作…`;
  result.hidden = true;
  empty.hidden = false;
  empty.innerHTML = `<div class="loading-lines"><i></i><i></i><i></i></div><h3>${videoFile ? "正在识别视频画面与口播" : "正在提炼内容"}，请稍候</h3><p>${videoFile ? "将结合关键帧、语音转写、商品露出和镜头节奏" : "AI 正在结合宠物赛道经验生成结果"}</p>`;
  const generators = {
    analyze: {
      prompt: d => `请结合上传视频的4张时间顺序关键帧和文字拆解宠物短视频。标题：${d.title || "未提供"}；数据：${d.stats || "未提供"}；文字：${d.content || "未提供"}；视频文件：${d.video_name || "未上传"}。如果提供了关键帧，必须描述帧中具体宠物、动作、商品、字幕、场景及前后画面变化，不能只分析标题或分享文字。只返回合法JSON：{"hook":"","emotion":"","structure":"","selling_points":"","closing":"","category":""}。`,
      demo: buildAnalyzeDemo,
    },
    script: {
      prompt: d => `为${d.product}一次生成3个差异明显的${d.duration}抖音带货成片脚本。宠物类型必须是：${d.pet}；卖点：${d.selling}；${d.audience ? `目标人群：${d.audience}` : "请自动识别目标人群与痛点"}。

系统已从模板库自动匹配以下3个参考模板：
${d.template_context}

本次创意种子：${d.creative_seed}。即使输入与上次相同，也必须更换开头措辞、场景动作、情绪推进和结尾话术，禁止复用上一次的固定句式。三个版本分别借鉴一个模板的核心结构，但必须围绕当前商品重新创作，不能机械复制模板原句。必须写可直接拍摄和直接念出的完整文案，不能只写策划说明。每个时间段必须包含时间、具体画面、逐字口播和屏幕字幕；每个版本必须包含开头3秒钩子、完整中段、卖点自然植入、结尾转化话术。生成前执行一致性检查：商品是“${d.product}”，宠物是“${d.pet}”；猫咪商品不得出现狗、狗粮、遛狗等内容，狗狗商品不得出现猫砂、猫罐头等内容。`,
      demo: buildScriptDemo,
    },
    persona: {
      prompt: d => `根据账号简介和3-5条视频文案分析宠物账号。简介：${d.bio || "未提供"}；文案：${d.scripts || "未提供"}。输出：人设类型（治愈型/测评型/剧情型等）、内容风格、核心标签3-5个、适合带货品类、优化建议。每项结论需引用输入证据，禁止泛泛而谈。`,
      demo: d => `## 人设类型\n**真实测评型 + 日常陪伴型**\n判断依据：“${(d.bio || d.scripts || "").replace(/\s+/g, " ").slice(0, 100)}”\n\n## 内容风格\n生活化、口语化，以宠物真实反应和主人体验建立信任。建议采用“日常问题—真实过程—宠物反馈”的稳定叙事。\n\n## 核心标签\n- 真实养宠\n- 新手避坑\n- 宠物好物实测\n- 铲屎官日常\n- 理性消费\n\n## 适合带货品类\n猫粮/狗粮、猫砂、除臭清洁、日常玩具、饮水与喂食用品。优先选择能现场展示效果、能拍宠物反馈的商品。\n\n## 优化建议\n1. 简介增加一句固定记忆点，明确宠物数量或性格。\n2. 每周固定一个测评栏目，统一封面和开场句。\n3. 带货内容先展示问题和真实使用，再讲商品卖点。\n4. 连续发布同主题3–5条，避免定位频繁变化。`,
    },
  };
  try {
    if (videoFile && !load("settings", {}).apiKey) {
      throw new Error("视频画面和语音识别需要先配置支持视觉与转写的 OpenAI API");
    }
    const [frames, transcript] = videoFile
      ? await Promise.all([extractVideoFrames(videoFile), transcribeMedia(videoFile)])
      : [[], ""];
    if (transcript) {
      data.content = `${data.content ? `${data.content}\n\n` : ""}[视频语音转写]\n${transcript}`;
    }
    const output = await generateWithAI(generators[type].prompt(data), () => generators[type].demo(data), frames);
    if (output.demo && type === "script") output.content = randomizeRuleVersions(output.content);
    const consistency = enforceContentConsistency(type, data, output.content);
    output.content = consistency.content;
    const matchNotice = type === "script" && data.matched_templates?.length
      ? `<div class="template-match-tag">已自动调用模板：${data.matched_templates.map(escapeHtml).join(" · ")}</div>`
      : "";
    const correctionNotice = consistency.corrected ? `<div class="correction-tag">已自动修正与当前商品或宠物类型冲突的内容</div>` : "";
    result.innerHTML = `${output.demo ? `<div class="demo-tag">规则生成模式 · 根据当前输入动态生成</div>` : ""}${correctionNotice}${matchNotice}${renderGeneratedContent(type, output.content)}`;
    result.hidden = false; empty.hidden = true;
    document.querySelector("[data-action='copy']").hidden = false;
    document.querySelector("[data-action='edit-result']").hidden = false;
    state.currentResult = output.content;
    const createdAt = Date.now();
    state.currentResultDate = createdAt;
    state.history.unshift({ type, date: createdAt, input: data, content: output.content });
    state.history = state.history.slice(0, 20); save("history", state.history);
  } catch (error) {
    empty.innerHTML = `<div class="empty-orbit">!</div><h3>生成未完成</h3><p>${escapeHtml(error.message)}</p>`;
    toast(error.message, true);
  } finally {
    button.disabled = false; button.innerHTML = `${icons.sparkle} ${type === "analyze" ? "分析视频与文案" : type === "script" ? "一键生成 3 个版本" : "分析账号人设"}`;
  }
}

function markdown(text) {
  const html = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/^- (.+)$/gm,"<li>$1</li>").replace(/^(\d+)\. (.+)$/gm,"<li><strong>$1.</strong> $2</li>").replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>");
  return html.replace(/<h2>(.*?)<\/h2>(.*?)(?=<h2>|$)/gs, '<section class="result-section"><h2>$1</h2><div class="result-section-body">$2</div></section>');
}

function renderGeneratedContent(type, content) {
  if (type !== "analyze") return markdown(content);
  try {
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const data = JSON.parse(cleaned);
    const fields = [
      ["hook", "爆款钩子", "⚡"],
      ["emotion", "情绪点", "♡"],
      ["structure", "内容结构", "▤"],
      ["selling_points", "带货卖点", "◆"],
      ["closing", "转化话术", "→"],
      ["category", "商品分类", "⌁"],
    ];
    return `<div class="analysis-card-grid">${fields.map(([key, label, icon]) => `
      <section class="analysis-card"><div class="analysis-card-title"><i>${icon}</i><h2>${label}</h2></div>
      <p>${escapeHtml(String(data[key] || "未识别到有效内容"))}</p></section>`).join("")}</div>`;
  } catch {
    return markdown(content);
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function copyResult() {
  const editor = document.querySelector(".result-editor");
  const content = editor && !editor.hidden ? editor.value : state.currentResult;
  navigator.clipboard.writeText(content || document.querySelector(".result-content").innerText.replace(/^演示模式.*\n/,""));
  toast("内容已复制到剪贴板");
}

function toggleResultEditor() {
  const editor = document.querySelector(".result-editor");
  const result = document.querySelector(".result-content");
  const button = document.querySelector("[data-action='edit-result']");
  if (editor.hidden) {
    editor.value = state.currentResult;
    editor.hidden = false;
    result.hidden = true;
    button.textContent = "✓ 保存修改";
    editor.focus();
    return;
  }
  const content = editor.value.trim();
  if (!content) {
    toast("内容不能为空", true);
    return;
  }
  state.currentResult = content;
  const historyItem = state.history.find(item => item.date === state.currentResultDate);
  if (historyItem) {
    historyItem.content = content;
    historyItem.editedAt = Date.now();
    save("history", state.history);
  }
  result.innerHTML = `<div class="restored-tag">已保存手动修改</div>${renderGeneratedContent(state.page, content)}`;
  editor.hidden = true;
  result.hidden = false;
  button.textContent = "✎ 编辑";
  toast("修改已保存到历史记录");
}

function showSettings() {
  const s = load("settings", {});
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop"><div class="modal"><button class="modal-close">×</button><div class="modal-icon">⚙</div><h2>AI 接口设置</h2><p class="modal-desc">支持 OpenAI 兼容接口。密钥仅保存在当前浏览器中。</p>
    <form id="settings-form">${field("接口地址","endpoint","https://api.openai.com/v1/chat/completions")}${field("模型名称","model","gpt-4o-mini")}
    <label class="field"><span>API Key</span><input name="apiKey" type="password" placeholder="sk-..." value="${s.apiKey || ""}"></label>
    <div class="security-note">🔒 请勿在公共电脑保存密钥。纯前端调用可能受接口跨域策略限制。</div>
    <button class="btn primary full">保存设置</button></form></div></div>`;
  const form = document.querySelector("#settings-form");
  form.endpoint.value = s.endpoint || "https://api.openai.com/v1/chat/completions";
  form.model.value = s.model || "gpt-4o-mini";
  document.querySelector(".modal-close").onclick = closeModal;
  document.querySelector(".modal-backdrop").onclick = e => { if (e.target === e.currentTarget) closeModal(); };
  form.onsubmit = e => { e.preventDefault(); save("settings", Object.fromEntries(new FormData(form))); closeModal(); toast("AI 接口设置已保存"); };
}

function showTemplate(id) {
  const t = templates.find(x => x.id === id);
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop"><div class="modal template-modal"><button class="modal-close">×</button><span class="modal-badge">${t.badge}</span><h2>${t.title}</h2><p class="modal-desc">${t.category} · ${t.pet} · ${t.duration}</p>
  <div class="template-fields">
    ${[
      ["hook","爆款钩子"],["emotion","情绪点"],["structure","内容结构"],
      ["selling_points","带货卖点"],["closing","转化话术"],["category","分类"],
    ].map(([key,label]) => `<div class="template-field"><small>${label}</small><p>${escapeHtml(t[key])}</p></div>`).join("")}
  </div>
  <a href="${pageUrls.script}" class="btn primary full" data-use-template>用这个结构生成脚本</a></div></div>`;
  document.querySelector(".modal-close").onclick = closeModal;
  document.querySelector("[data-use-template]").onclick = () => {
    save("selected-template", t);
    closeModal();
  };
}

function libraryScriptText(item) {
  return `${item.title}

开头钩子：${item.hook}

${item.scene_script.map(scene => `${scene.time}
画面：${scene.shot}
口播：${scene.voiceover}
字幕：${scene.subtitle}`).join("\n\n")}

结尾：${item.closing}
合规提示：${item.compliance_note}`;
}

function showLibraryScript(id) {
  const item = copyLibrary.scripts.find(script => script.id === id);
  if (!item) return;
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop"><div class="modal history-modal"><button class="modal-close">×</button>
    <span class="modal-badge">${item.angle}</span><h2>${escapeHtml(item.title)}</h2>
    <p class="modal-desc">${item.category} · ${item.pet} · ${item.duration} · 编号 ${item.id}</p>
    <div class="template-fields">
      <div class="template-field"><small>开头钩子</small><p>${escapeHtml(item.hook)}</p></div>
      ${item.scene_script.map(scene => `<div class="template-field"><small>${scene.time}</small><p><b>画面：</b>${escapeHtml(scene.shot)}<br><b>口播：</b>${escapeHtml(scene.voiceover)}<br><b>字幕：</b>${escapeHtml(scene.subtitle)}</p></div>`).join("")}
      <div class="template-field"><small>合规提示</small><p>${escapeHtml(item.compliance_note)}</p></div>
    </div>
    <div class="library-actions"><button class="btn ghost" data-copy-library>复制完整文案</button><a href="${pageUrls.script}" class="btn primary" data-use-library>载入生成器</a></div>
  </div></div>`;
  document.querySelector(".modal-close").onclick = closeModal;
  document.querySelector(".modal-backdrop").onclick = event => { if (event.target === event.currentTarget) closeModal(); };
  document.querySelector("[data-copy-library]").onclick = () => {
    navigator.clipboard.writeText(libraryScriptText(item));
    toast("完整文案已复制");
  };
  document.querySelector("[data-use-library]").onclick = () => {
    save("selected-template", { title: item.title, category: item.category, selling_points: `${item.selling_points}；参考角度：${item.angle}；参考钩子：${item.hook}` });
    closeModal();
  };
}

function showHistory(index) {
  const item = state.history[index];
  if (!item) return;
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop"><div class="modal history-modal"><button class="modal-close">×</button>
    <span class="modal-badge">${typeNames[item.type] || "AI 生成"}</span><h2>${escapeHtml(item.input?.product || item.input?.title || item.input?.pet || "生成结果")}</h2>
    <p class="modal-desc">${formatDate(item.date)}</p><article class="result-content">${renderGeneratedContent(item.type, item.content)}</article>
    <button class="btn primary full" data-copy-history>复制全部内容</button></div></div>`;
  document.querySelector(".modal-close").onclick = closeModal;
  document.querySelector("[data-copy-history]").onclick = () => {
    navigator.clipboard.writeText(item.content);
    toast("内容已复制到剪贴板");
  };
}

function clearHistory() {
  if (!window.confirm("确定清空全部历史生成记录吗？此操作无法撤销。")) return;
  state.history = [];
  save("history", state.history);
  render();
  toast("历史记录已清空");
}

function closeModal() { document.querySelector("#modal-root").innerHTML = ""; }
function toast(message, error = false) {
  const el = document.querySelector("#toast"); el.textContent = message; el.className = `toast show ${error ? "error" : ""}`;
  setTimeout(() => el.className = "toast", 2400);
}

render();
