// utils/ai.js
// AI调用封装，唯一的AI调用入口

/**
 * 流式生成故事
 * @param {Object} params - 生成参数
 * @param {string} params.model - 模型名称
 * @param {Array} params.messages - 消息列表
 * @param {Object} callbacks - 回调函数
 * @param {Function} callbacks.onChunk - 每次收到chunk的回调
 * @param {Function} callbacks.onDone - 完成时的回调
 * @param {Function} callbacks.onError - 错误时的回调
 */
function generateStoryStream(params, callbacks) {
  callbacks = callbacks || {};
  const onChunk = callbacks.onChunk;
  const onDone = callbacks.onDone;
  const onError = callbacks.onError;

  console.log('[ai] generateStoryStream called, model:', params.model);

  try {
    if (!wx.cloud) {
      throw new Error('wx.cloud is undefined');
    }
    if (!wx.cloud.extend) {
      throw new Error('wx.cloud.extend is undefined');
    }
    if (!wx.cloud.extend.AI) {
      throw new Error('wx.cloud.extend.AI is undefined');
    }

    const model = wx.cloud.extend.AI.createModel("hunyuan-exp");

    // 调用 streamText
    const streamResult = model.streamText({
      data: {
        model: params.model || 'hunyuan-turbos-latest',
        messages: params.messages
      }
    });

    console.log('[ai] streamResult type:', typeof streamResult);

    // streamText 可能返回 Promise 或直接对象
    if (streamResult && typeof streamResult.then === 'function') {
      console.log('[ai] streamText returned a Promise, awaiting...');

      streamResult.then(function(res) {
        console.log('[ai] streamResult resolved, res.eventStream:', typeof res?.eventStream);

        if (res && res.eventStream) {
          handleStream(res.eventStream);
        } else {
          console.error('[ai] res.eventStream is undefined');
          if (onError) onError(new Error('streamText 返回格式错误'));
        }
      }).catch(function(err) {
        console.error('[ai] streamText promise error:', err);
        if (onError) onError(err);
      });

    } else if (streamResult && streamResult.eventStream) {
      console.log('[ai] streamResult has eventStream directly');
      handleStream(streamResult.eventStream);
    } else {
      console.error('[ai] streamResult format unexpected:', streamResult);
      if (onError) onError(new Error('streamText 返回格式错误'));
    }

    // 处理事件流
    function handleStream(eventStream) {
      console.log('[ai] handling stream...');

      const iterate = async function() {
        try {
          for await (let event of eventStream) {
            if (event.data === "[DONE]") {
              console.log('[ai] stream done');
              break;
            }

            const data = JSON.parse(event.data);
            const text = data?.choices?.[0]?.delta?.content;

            if (text && onChunk) {
              onChunk(text);
            }
          }

          console.log('[ai] stream completed');
          if (onDone) onDone();
        } catch (err) {
          console.error('[ai] iterate error:', err);
          if (onError) onError(err);
        }
      };

      iterate().catch(function(err) {
        console.error('[ai] iterate catch error:', err);
        if (onError) onError(err);
      });
    }

    // 返回stream对象，支持取消
    return {
      abort: function() {
        console.log('[ai] stream abort called');
      }
    };
  } catch (err) {
    console.error('[ai] try-catch error:', err);
    if (onError) onError(err);
    return { abort: function() {} };
  }
}

/**
 * 完整生成（不流式，返回完整内容）
 */
async function generateStory(params) {
  return new Promise(function(resolve, reject) {
    let fullContent = '';

    generateStoryStream(params, {
      onChunk: function(text) {
        fullContent += text;
      },
      onDone: function() {
        resolve(fullContent);
      },
      onError: function(err) {
        reject(err);
      }
    });
  });
}

module.exports = {
  generateStoryStream,
  generateStory
};
