// modules/ai/service.js
// 唯一包含async/await的层，调用utils

import { generateStoryStream as streamGen } from '../../utils/ai.js';
import { PROMPT_TEMPLATES, AIModel } from './model.js';

let currentStream = null;

export const AIService = {
  // 完整生成（不流式）
  async generate({ category, topic }) {
    const prompt = PROMPT_TEMPLATES[category].replace('{topic}', topic);

    let fullContent = '';
    const buffer = [];

    await new Promise((resolve, reject) => {
      streamGen({
        model: 'hunyuan-turbos-latest',
        messages: [{ role: 'user', content: prompt }]
      }, {
        onChunk: (text) => {
          buffer.push(text);
        },
        onDone: () => {
          fullContent = buffer.join('');
          resolve();
        },
        onError: (err) => {
          reject(err);
        }
      });
    });

    return fullContent;
  },

  // 流式生成（带buffer优化，解决闪烁问题）
  generateStream({ category, topic }, callbacks = {}) {
    const prompt = PROMPT_TEMPLATES[category].replace('{topic}', topic);
    const { onChunk, onDone, onError } = callbacks;

    // buffer用于解决AI生成闪烁问题（P0性能瓶颈）
    let buffer = '';
    const BUFFER_SIZE = AIModel.config.streamBufferSize;

    const stream = streamGen({
      model: 'hunyuan-turbos-latest',
      messages: [{ role: 'user', content: prompt }]
    }, {
      onChunk: (text) => {
        buffer += text;

        // 攒够buffer size再回调，减少setData频率
        if (buffer.length >= BUFFER_SIZE) {
          if (onChunk) onChunk(buffer);
          buffer = '';
        }
      },
      onDone: () => {
        // 输出剩余buffer
        if (buffer && onChunk) {
          onChunk(buffer);
        }
        if (onDone) onDone();
      },
      onError: (err) => {
        if (onError) onError(err);
      }
    });

    currentStream = stream;
    return stream;
  },

  // 取消生成
  cancel() {
    if (currentStream) {
      currentStream.abort();
      currentStream = null;
    }
  }
};