// modules/ai/api.js
// 禁止在此文件写任何业务逻辑

const { AIService } = require('./service.js');

async function generateStory(category, topic, mode = 'mixed') {
  return await AIService.generate({ category, topic, mode });
}

function generateStoryStream(category, topic, mode, callbacks) {
  // 兼容旧调用：generateStoryStream(category, topic, callbacks)
  if (typeof mode === 'object' && mode !== null) {
    callbacks = mode;
    mode = 'mixed';
  }
  return AIService.generateStream({ category, topic, mode }, callbacks);
}

function cancelGenerate() {
  AIService.cancel();
}

module.exports = {
  generateStory,
  generateStoryStream,
  cancelGenerate
};