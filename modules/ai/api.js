// modules/ai/api.js
// 禁止在此文件写任何业务逻辑

import { AIService } from './service.js';

export async function generateStory(category, topic) {
  return await AIService.generate({ category, topic });
}

export function generateStoryStream(category, topic, callbacks) {
  return AIService.generateStream({ category, topic }, callbacks);
}

export function cancelGenerate() {
  AIService.cancel();
}