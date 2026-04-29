// modules/ai/model.js
// 禁止在此文件写任何执行逻辑

const AIModel = {
  // 模型名称
  modelName: 'hunyuan-exp',

  // 生成配置
  config: {
    maxTokens: 1000,
    temperature: 0.8,
    streamBufferSize: 10 // 攒够多少字再渲染
  }
};

// 分类对应的prompt模板（基础模板，需要拼接模式部分）
const CATEGORY_TEMPLATES = {
  xuanhuan: '请生成一个200字左右的玄幻修仙风格故事，',
  city: '请生成一个200字左右的都市异能风格故事，',
  history: '请生成一个200字左右的历史穿越风格故事，',
  apocalypse: '请生成一个200字左右的末日逃生风格故事，'
};

// 模式对应的prompt片段
const MODE_TEMPLATES = {
  // 中英夹杂：基础版本
  mixed: `要求：
1. 故事使用中英夹杂的表达方式
2. 英文单词用括号标注中文解释，格式如：career(事业)、basement(地下室)
3. 英文单词应该是小学生或初中生学过的基础词汇
4. 情节曲折，有代入感
5. 故事要自然流畅，中文为主，英文单词均匀分布在句子中`,
  // 全中文：只保留中文内容和中文解释
  cn: `要求：
1. 故事使用全中文的表达方式
2. 英文单词需要翻译成中文，用括号标注，格式如：career(事业)写作"事业"
3. 情节曲折，有代入感
4. 故事要自然流畅，全部使用中文`,
  // 全英文：只保留英文单词
  en: `要求：
1. 故事使用全英文的表达方式
2. 故事中只使用英文单词，用英文讲述完整故事
3. 使用简单的英文词汇，适合小学生或初中生理解
4. 情节曲折，有代入感
5. 故事要自然流畅，用英文完整表达`
};

// 组合生成prompt
function buildPrompt(category, topic, mode) {
  const categoryPart = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.xuanhuan;
  const modePart = MODE_TEMPLATES[mode] || MODE_TEMPLATES.mixed;
  return categoryPart + modePart + '\n\n用户主题：' + topic;
}

module.exports = {
  AIModel,
  CATEGORY_TEMPLATES,
  MODE_TEMPLATES,
  buildPrompt
};