// modules/progress/service.js
// 唯一包含async/await的层，调用utils

import { db } from '../../utils/db.js';
import { storage } from '../../utils/storage.js';
import { ProgressModel } from './model.js';

export const ProgressService = {
  // 获取进度列表
  async getList(openid) {
    const cacheKey = 'progress_' + openid;
    const cached = storage.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const res = await db.collection('user_progress')
        .where({ openid })
        .get();

      const data = res.data || [];
      storage.set(cacheKey, data);
      return data;
    } catch (err) {
      console.error('[progress] getList error:', err);
      return [];
    }
  },

  // 更新进度
  async update(openid, articleId, status) {
    const data = {
      openid,
      articleId,
      status,
      updateTime: Date.now()
    };

    // 先更新本地缓存
    const cacheKey = 'progress_' + openid;
    let list = storage.get(cacheKey) || [];
    const index = list.findIndex(p => p.articleId === articleId);

    if (index >= 0) {
      list[index] = { ...list[index], ...data };
    } else {
      list.push(data);
    }
    storage.set(cacheKey, list);

    // 异步同步到云端
    try {
      await db.collection('user_progress')
        .where({ openid, articleId })
        .update({ data });
    } catch (err) {
      // 不存在则新增
      return await db.collection('user_progress').add({ data });
    }

    return data;
  },

  // 添加收藏
  async addFavorite(openid, articleId) {
    const data = {
      openid,
      articleId,
      createdAt: Date.now()
    };

    // 更新本地收藏列表缓存
    const cacheKey = 'favorites_' + openid;
    let list = storage.get(cacheKey) || [];
    if (!list.find(f => f.articleId === articleId)) {
      list.unshift(data);
      storage.set(cacheKey, list);
    }

    // 异步同步到云端
    try {
      await db.collection('user_favorite')
        .where({ openid, articleId })
        .update({ data });
    } catch (err) {
      return await db.collection('user_favorite').add({ data });
    }

    return data;
  },

  // 移除收藏
  async removeFavorite(openid, articleId) {
    // 更新本地缓存
    const cacheKey = 'favorites_' + openid;
    let list = storage.get(cacheKey) || [];
    list = list.filter(f => f.articleId !== articleId);
    storage.set(cacheKey, list);

    // 同步到云端
    return await db.collection('user_favorite')
      .where({ openid, articleId })
      .remove();
  },

  // 获取收藏列表
  async getFavorites(openid) {
    const cacheKey = 'favorites_' + openid;
    const cached = storage.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const res = await db.collection('user_favorite')
        .where({ openid })
        .orderBy('createdAt', 'desc')
        .get();

      const data = res.data || [];
      storage.set(cacheKey, data);
      return data;
    } catch (err) {
      console.error('[progress] getFavorites error:', err);
      return [];
    }
  }
};