// pages/index/index.js
// 首页：分类选择、预置短文列表、AI生成入口

import { fetchArticleList } from '../../../modules/article/index.js';
import { CATEGORIES } from '../../../modules/article/model.js';
import { getProgress } from '../../../modules/progress/index.js';

Page({
  data: {
    categories: CATEGORIES,
    articleList: [],
    selectedCategory: null,
    loading: false,
    progressMap: {} // articleId -> status
  },

  onLoad() {
    this.checkMemberStatus();
  },

  onShow() {
    this.loadProgress();
  },

  // 选择分类
  async onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ selectedCategory: category, loading: true });

    try {
      const list = await fetchArticleList(category);
      this.setData({ articleList: list });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 进入阅读页
  onArticleTap(e) {
    const articleId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/read/index?id=${articleId}`
    });
  },

  // 进入AI生成页
  onGenerateTap() {
    wx.navigateTo({
      url: '/pages/generate/index'
    });
  },

  // 加载用户进度
  async loadProgress() {
    try {
      const openid = getApp().globalData.openid;
      if (!openid) return;

      const list = await getProgress(openid);
      const map = {};
      list.forEach(p => {
        map[p.articleId] = p.status;
      });
      this.setData({ progressMap: map });
    } catch (err) {
      console.error('[index] loadProgress error:', err);
    }
  },

  // 检查会员状态
  checkMemberStatus() {
    const status = getApp().globalData.memberStatus;
    this.setData({ memberStatus: status });
  }
});