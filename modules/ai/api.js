// modules/ai/api.js
// 禁止在此文件写任何业务逻辑

const { AIService } = require('./service.js');

async function generateStory(category, topic) {
  return await AIService.generate({ category, topic });
}

function generateStoryStream(category, topic, callbacks) {
  return AIService.generateStream({ category, topic }, callbacks);
}

function cancelGenerate() {
  AIService.cancel();
}

module.exports = {
  generateStory,
  generateStoryStream,
  cancelGenerate
};
