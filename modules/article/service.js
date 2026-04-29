// modules/article/service.js
// 唯一包含async/await的层，调用utils

const storage = require('../../utils/storage.js');

const ArticleService = {
  // 从本地缓存获取分类列表
  async getListByCategory(category) {
    // 先从本地缓存获取
    const cached = storage.get('articles_' + category);
    if (cached) {
      return cached;
    }

    // 通过云函数获取
    const { result } = await wx.cloud.callFunction({
      name: 'getArticles',
      data: { category }
    });

    // 缓存到本地
    storage.set('articles_' + category, result.data);
    return result.data;
  },

  // 获取单篇文章详情
  async getById(id) {
    const { result } = await wx.cloud.callFunction({
      name: 'getArticles',
      data: { id }
    });
    return result.data;  // id查询返回的是单个对象，不是数组
  },

  // 保存文章（用于AI生成结果）
  async save(article) {
    // 云函数写入
    return await wx.cloud.callFunction({
      name: 'getArticles',
      data: { action: 'add', article }
    });
  },

  // 获取AI生成的文章列表
  async getGeneratedList(openid) {
    const { result } = await wx.cloud.callFunction({
      name: 'getArticles',
      data: { action: 'generated', openid }
    });
    return result.data;
  }
};

module.exports = { ArticleService };
