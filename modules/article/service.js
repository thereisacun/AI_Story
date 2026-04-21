// modules/article/service.js
// 唯一包含async/await的层，调用utils

import { db } from '../../utils/db.js';
import { storage } from '../../utils/storage.js';

export const ArticleService = {
  // 从本地缓存获取分类列表
  async getListByCategory(category) {
    // 先从本地缓存获取
    const cached = storage.get('articles_' + category);
    if (cached) {
      return cached;
    }

    // 从云开发数据库获取
    const res = await db.collection('articles')
      .where({ category })
      .get();

    // 缓存到本地
    storage.set('articles_' + category, res.data);
    return res.data;
  },

  // 获取单篇文章详情
  async getById(id) {
    return await db.collection('articles').doc(id).get();
  },

  // 保存文章（用于AI生成结果）
  async save(article) {
    return await db.collection('ai_generated').add({
      data: {
        ...article,
        createdAt: Date.now()
      }
    });
  },

  // 获取AI生成的文章列表
  async getGeneratedList(openid) {
    return await db.collection('ai_generated')
      .where({ openid })
      .orderBy('createdAt', 'desc')
      .get();
  }
};