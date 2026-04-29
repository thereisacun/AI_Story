// modules/progress/service.js
// 唯一包含async/await的层，调用utils

const { getDB } = require('../../utils/db.js');
const { storage } = require('../../utils/storage.js');

const ProgressService = {
  // 获取进度列表
  async getList(openid) {
    const cacheKey = 'progress_' + openid;
    const cached = storage.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const db = await getDB();
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
    const index = list.findIndex(function(p) { return p.articleId === articleId; });

    if (index >= 0) {
      list[index] = Object.assign({}, list[index], data);
    } else {
      list.push(data);
    }
    storage.set(cacheKey, list);

    // 异步同步到云端
    try {
      const db = await getDB();
      await db.collection('user_progress')
        .where({ openid: openid, articleId: articleId })
        .update({ data: data });
    } catch (err) {
      // 不存在则新增
      const db = await getDB();
      return await db.collection('user_progress').add({ data: data });
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
    if (!list.find(function(f) { return f.articleId === articleId; })) {
      list.unshift(data);
      storage.set(cacheKey, list);
    }

    // 异步同步到云端
    try {
      const db = await getDB();
      await db.collection('user_favorite')
        .where({ openid: openid, articleId: articleId })
        .update({ data: data });
    } catch (err) {
      const db = await getDB();
      return await db.collection('user_favorite').add({ data: data });
    }

    return data;
  },

  // 移除收藏
  async removeFavorite(openid, articleId) {
    // 更新本地缓存
    const cacheKey = 'favorites_' + openid;
    let list = storage.get(cacheKey) || [];
    list = list.filter(function(f) { return f.articleId !== articleId; });
    storage.set(cacheKey, list);

    // 同步到云端
    const db = await getDB();
    return await db.collection('user_favorite')
      .where({ openid: openid, articleId: articleId })
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
      const db = await getDB();
      const res = await db.collection('user_favorite')
        .where({ openid: openid })
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

module.exports = { ProgressService };
