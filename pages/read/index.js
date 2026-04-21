// pages/read/index.js
// 阅读页：短文展示 + 三种显示模式切换

import { getArticleDetail } from '../../../modules/article/index.js';
import { DISPLAY_MODE } from '../../../modules/article/model.js';
import { updateProgress, addFavorite, removeFavorite } from '../../../modules/progress/index.js';

Page({
  data: {
    article: null,
    displayMode: DISPLAY_MODE.MIXED, // 默认中英夹杂
    isFavorite: false,
    loading: true
  },

  computed: {
    // 计算属性：根据displayMode返回不同格式的内容
    displayContent() {
      const { article, displayMode } = this.data;
      if (!article) return '';

      switch (displayMode) {
        case DISPLAY_MODE.MIXED:
          return article.content; // 中英夹杂原版
        case DISPLAY_MODE.CN_ONLY:
          return this.extractChinese(article.content);
        case DISPLAY_MODE.EN_ONLY:
          return this.extractEnglish(article.content);
        default:
          return article.content;
      }
    }
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.loadArticle(id);
    }
  },

  onShow() {
    // 页面展示时更新阅读进度
    this.updateReadingProgress();
  },

  // 加载文章
  async loadArticle(id) {
    this.setData({ loading: true });
    try {
      const article = await getArticleDetail(id);
      this.setData({
        article,
        loading: false
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 切换显示模式
  onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ displayMode: mode });
  },

  // 切换收藏
  async onFavoriteTap() {
    const { article, isFavorite } = this.data;
    const openid = getApp().globalData.openid;

    try {
      if (isFavorite) {
        await removeFavorite(openid, article._id);
        this.setData({ isFavorite: false });
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      } else {
        await addFavorite(openid, article._id);
        this.setData({ isFavorite: true });
        wx.showToast({ title: '已收藏', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 分享
  onShareAppMessage() {
    const { article } = this.data;
    return {
      title: article?.title || 'AI短文记单词',
      path: `/pages/read/index?id=${article?._id}`
    };
  },

  // 更新阅读进度
  async updateReadingProgress() {
    const { article } = this.data;
    if (!article) return;

    const openid = getApp().globalData.openid;
    try {
      await updateProgress(openid, article._id, 1); // 1 = READING
    } catch (err) {
      console.error('[read] updateProgress error:', err);
    }
  },

  // 标记已完成
  async onFinishTap() {
    const { article } = this.data;
    const openid = getApp().globalData.openid;

    try {
      await updateProgress(openid, article._id, 2); // 2 = FINISHED
      wx.showToast({ title: '已标记为读完', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 提取纯中文（去掉[]括起来的英文）
  extractChinese(content) {
    return content.replace(/\[([^\]]+)\]/g, '$1');
  },

  // 提取纯英文（显示英文，隐藏中文）
  extractEnglish(content) {
    // 中英夹杂格式: 我去[超市]买[苹果]
    // 提取[]内的英文
    const words = [];
    const regex = /\[([^\]]+)\]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      words.push(match[1]);
    }
    return words.join(' ');
  }
});