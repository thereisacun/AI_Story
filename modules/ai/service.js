// modules/ai/service.js
// 唯一包含async/await的层，调用utils

const { generateStoryStream: streamGen } = require('../../utils/ai.js');
const { PROMPT_TEMPLATES, AIModel } = require('./model.js');

let currentStream = null;

const AIService = {
  // 完整生成（不流式）
  async generate(params) {
    const category = params.category;
    const topic = params.topic;
    const prompt = PROMPT_TEMPLATES[category].replace('{topic}', topic);

    let fullContent = '';
    const buffer = [];

    await new Promise(function(resolve, reject) {
      streamGen({
        model: 'hunyuan-turbos-latest',
        messages: [{ role: 'user', content: prompt }]
      }, {
        onChunk: function(text) {
          buffer.push(text);
        },
        onDone: function() {
          fullContent = buffer.join('');
          resolve();
        },
        onError: function(err) {
          reject(err);
        }
      });
    });

    return fullContent;
  },

  // 流式生成（带buffer优化，解决闪烁问题）
  generateStream(params, callbacks) {
    const category = params.category;
    const topic = params.topic;
    const prompt = PROMPT_TEMPLATES[category].replace('{topic}', topic);
    const onChunk = callbacks.onChunk;
    const onDone = callbacks.onDone;
    const onError = callbacks.onError;

    // buffer用于解决AI生成闪烁问题（P0性能瓶颈）
    let buffer = '';
    const BUFFER_SIZE = AIModel.config.streamBufferSize;

    const stream = streamGen({
      model: 'hunyuan-turbos-latest',
      messages: [{ role: 'user', content: prompt }]
    }, {
      onChunk: function(text) {
        buffer += text;

        // 攒够buffer size再回调，减少setData频率
        if (buffer.length >= BUFFER_SIZE) {
          if (onChunk) onChunk(buffer);
          buffer = '';
        }
      },
      onDone: function() {
        // 输出剩余buffer
        if (buffer && onChunk) {
          onChunk(buffer);
        }
        if (onDone) onDone();
      },
      onError: function(err) {
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

module.exports = { AIService };
