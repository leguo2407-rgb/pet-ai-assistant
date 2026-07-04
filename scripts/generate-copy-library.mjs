import { mkdir, writeFile } from "node:fs/promises";

const categories = [
  ["猫粮", "猫咪", "挑食、换粮和日常喂养", "颗粒、配料表、建议喂食量与真实试吃", "换粮请循序渐进，具体配料与喂食量以包装说明为准"],
  ["狗粮", "狗狗", "挑食、囤粮和不同体型的喂养", "颗粒大小、配料表、建议喂食量与真实试吃", "按犬只年龄和体型选择，换粮请循序渐进"],
  ["除臭", "通用", "猫砂盆、窝垫和宠物活动区的异味", "使用范围、操作过程、前后感受与注意事项", "先清洁异味源并按说明使用，避开宠物眼口鼻"],
  ["猫砂", "猫咪", "粉尘、粘底、带砂和清理费时", "统一水量下的结团、扬尘、粘底与带砂测试", "测试结果受砂盆、铺砂厚度和使用习惯影响"],
  ["猫零食组合礼包", "猫咪", "口味单一、囤货难选和互动奖励", "礼包明细、单品规格、喂食场景与猫咪反馈", "零食不能代替主食，请按包装建议控制喂食量"],
  ["狗粮零食组合礼包", "狗狗", "主粮囤货、训练奖励和多场景喂养", "主粮与零食明细、规格、适用场景和狗狗反馈", "零食不能代替主食，按犬只体型控制每日摄入"],
  ["排毛粉", "猫咪", "换毛期舔毛多和日常毛发管理", "配料表、建议用量、拌粮过程与接受度记录", "本品不是药品；按说明喂食，持续不适请咨询兽医"],
  ["猫罐头", "猫咪", "挑食、补充水分和加餐选择", "开罐质地、配料标识、净含量与真实试吃", "确认主食罐或零食罐属性，按包装说明合理喂食"],
  ["狗罐头", "狗狗", "拌粮、挑食和外出加餐", "开罐质地、配料标识、净含量与真实试吃", "确认产品属性并按犬只体型控制喂食量"],
].map(([category, pet, pain, proof, caution]) => ({ category, pet, pain, proof, caution }));

const angles = [
  ["真实试吃", "别急着听我夸，先看它第一口的反应。"], ["三项实测", "值不值得买，不看广告，今天只测三个细节。"],
  ["七天记录", "第一天和第七天，变化都在这个镜头里。"], ["同价对比", "同样的预算，差别可能藏在你没注意的地方。"],
  ["新手避坑", "第一次买先别下单，这三个坑很容易踩。"], ["开箱清单", "这一箱到底有什么，我按件给你拆清楚。"],
  ["使用前后", "使用前我最头疼的是这个，实际用完再说结果。"], ["一分钟讲清", "别被一堆参数绕晕，一分钟讲清怎么选。"],
  ["多宠家庭", "家里不止一只毛孩子，消耗和选择逻辑完全不同。"], ["懒人方案", "每天少折腾十分钟，我靠的是这套简单流程。"],
  ["预算拆解", "别只看整单价格，算到每天才知道值不值。"], ["成分阅读", "包装正面先放一边，真正该看的信息在背面。"],
  ["错误示范", "这个用法我也做错过，难怪之前一直没效果。"], ["场景挑战", "今天不剪结果，直接做一次真实场景挑战。"],
  ["朋友盲测", "我没告诉朋友换了什么，进门后她先说了这句话。"], ["宠物视角", "如果毛孩子会说话，它挑东西大概只看这几件事。"],
  ["囤货建议", "活动再便宜，也不是所有家庭都适合一次囤很多。"], ["细节特写", "镜头拉近以后，这个细节比宣传词更有说服力。"],
  ["日常跟拍", "没有摆拍，就是今天一次普通的喂养记录。"], ["反常识", "你以为越贵越好，其实适合比价格更重要。"],
  ["快速测评", "给我三十秒，把优点、限制和适合谁一次说完。"], ["回购复盘", "用到第二次才来讲，因为第一次的新鲜感不算数。"],
  ["不同体型", "同一款东西，小体型和大体型的用法真不一样。"], ["早晚流程", "早上赶时间、晚上想省心，我分别这样安排。"],
  ["租房养宠", "空间不大又怕有味，选东西更要看实际场景。"], ["替换旧款", "旧的还没用完我就换了，原因不是跟风。"],
  ["问答口播", "评论区问得最多的三个问题，今天一起回答。"], ["清单种草", "适合谁、不适合谁、怎么买，我给你列成清单。"],
  ["限时活动", "先看商品再看活动，别因为便宜买到不适合的。"], ["结果先行", "先给结论：有亮点，但它并不适合所有毛孩子。"],
];

const endings = ["先看商品页的规格和完整信息，确认适合自家毛孩子再下单。", "别只看活动价，结合实际用量和自家宠物习惯再决定。", "需要的可以先收藏对照，按商品说明选择合适规格。", "我把适合人群和注意事项都说清了，符合需求再考虑。", "每只宠物反馈不同，建议先从合适规格开始尝试。"];

function makeScript(meta, categoryIndex, index) {
  const [angle, baseHook] = angles[index];
  const duration = [30, 35, 40, 45, 38][index % 5];
  const hook = `${baseHook}${meta.category === "排毛粉" ? "先说明，它不是药。" : ""}`;
  const scenes = [
    { time: "0-3秒", shot: `${meta.pet === "狗狗" ? "狗狗" : meta.pet === "猫咪" ? "猫咪" : "宠物活动区"}与商品同框，快速推近`, voiceover: hook, subtitle: angle },
    { time: `4-${Math.round(duration * .35)}秒`, shot: `展示${meta.pain}的真实场景，不使用夸张前后对比`, voiceover: `买${meta.category}，我最在意的不是包装，而是它能不能解决${meta.pain}。`, subtitle: "先看需求，不盲买" },
    { time: `${Math.round(duration * .35) + 1}-${Math.round(duration * .75)}秒`, shot: `连续特写展示${meta.proof}`, voiceover: `所以这次我把${meta.proof}都拍出来。看得到的细节，比一句“特别好用”更可靠。`, subtitle: "证据实拍｜信息以包装为准" },
    { time: `${Math.round(duration * .75) + 1}-${duration}秒`, shot: "商品、宠物反馈与包装说明同框，镜头稳定收尾", voiceover: `${meta.caution}。${endings[index % 5]}`, subtitle: "理性选择｜适合再买" },
  ];
  return {
    id: `${String(categoryIndex + 1).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
    category: meta.category, pet: meta.pet, title: `${angle}｜${meta.category}${["怎么选", "值不值", "实拍记录", "购买前必看", "真实体验"][index % 5]}`,
    angle, duration: `${duration}秒`, hook, target_pain: meta.pain, selling_points: meta.proof,
    scene_script: scenes, closing: endings[index % 5], compliance_note: meta.caution,
    tags: [meta.category, angle, meta.pet, "宠物带货", "短视频脚本"],
  };
}

const scripts = categories.flatMap((meta, categoryIndex) => angles.map((_, index) => makeScript(meta, categoryIndex, index)));
const library = {
  schema_version: "1.0", name: "宠物带货文案库", generated_at: "2026-07-04", total: scripts.length,
  categories: categories.map(meta => ({ name: meta.category, count: 30 })), scripts,
};

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(new URL("../data/copy-library.json", import.meta.url), `${JSON.stringify(library, null, 2)}\n`);
await writeFile(new URL("../assets/copy-library.js", import.meta.url), `// 由 scripts/generate-copy-library.mjs 生成，请勿手工修改。\nexport const copyLibrary = ${JSON.stringify(library, null, 2)};\n`);
console.log(`Generated ${scripts.length} scripts across ${categories.length} categories.`);
