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
export function generateStoryStream(params, callbacks = {}) {
  const { onChunk, onDone, onError } = callbacks;

  try {
    const model = wx.cloud.extend.AI.createModel("hunyuan-exp");

    const stream = model.streamText({
      data: {
        model: params.model || 'hunyuan-turbos-latest',
        messages: params.messages
      }
    });

    // 遍历事件流
    const iterate = async () => {
      try {
        for await (let event of stream.eventStream) {
          if (event.data === "[DONE]") {
            break;
          }

          const data = JSON.parse(event.data);
          const text = data?.choices?.[0]?.delta?.content;

          if (text && onChunk) {
            onChunk(text);
          }
        }

        if (onDone) onDone();
      } catch (err) {
        if (onError) onError(err);
      }
    };

    iterate();

    // 返回stream对象，支持取消
    return {
      abort: () => {
        // 微信云开发的stream不支持直接abort，返回空函数
        console.log('[ai] stream abort called');
      }
    };
  } catch (err) {
    if (onError) onError(err);
    return { abort: () => {} };
  }
}

/**
 * 完整生成（不流式，返回完整内容）
 */
export async function generateStory(params) {
  return new Promise((resolve, reject) => {
    let fullContent = '';

    generateStoryStream(params, {
      onChunk: (text) => {
        fullContent += text;
      },
      onDone: () => {
        resolve(fullContent);
      },
      onError: (err) => {
        reject(err);
      }
    });
  });
}