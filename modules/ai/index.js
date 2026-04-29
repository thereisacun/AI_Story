// modules/ai/index.js
// 禁止在此文件写任何业务逻辑

const { generateStory, generateStoryStream, cancelGenerate } = require('./api.js');
const { AIModel } = require('./model.js');
const { AIService } = require('./service.js');

module.exports = {
  generateStory,
  generateStoryStream,
  cancelGenerate,
  AIModel,
  AIService
};
