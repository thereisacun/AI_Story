// pages/read/index.js
// 阅读页：短文展示 + 三种显示模式切换

const { getArticleDetail } = require('../../modules/article/index.js');
const { DISPLAY_MODE } = require('../../modules/article/model.js');
const { updateProgress, addFavorite, removeFavorite } = require('../../modules/progress/index.js');

Page({
  data: {
    article: null,
    displayMode: 'mixed', // 默认中英夹杂（使用字符串）
    isFavorite: false,
    loading: true,
    displayContent: '',
    isFromAI: false,
    isGenerating: false,
    generatingTopic: '',
    generatingCategory: '',
    generatingContentMixed: '',
    generatingContentCn: '',
    generatingContentEn: '',
    pollingTimer: null
  },

  onLoad(options) {
    const { id, generating, category, topic } = options;

    if (generating === '1' && category && topic) {
      this.setData({
        isFromAI: true,
        isGenerating: true,
        generatingTopic: decodeURIComponent(topic),
        generatingCategory: category,
        loading: false
      });
      this.startPollingGeneratingContent();
      return;
    }

    if (id) {
      this.loadArticle(id);
    }
  },

  onUnload() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  },

  onShow() {
    this.updateReadingProgress();
  },

  startPollingGeneratingContent() {
    const self = this;
    this.checkGeneratingContent();
    this.pollingTimer = setInterval(function() {
      self.checkGeneratingContent();
    }, 300);
  },

  checkGeneratingContent() {
    const app = getApp();
    const { generatingDone, generatingError, generatingContentMixed, generatingContentCn, generatingContentEn } = app.globalData;

    // 直接从 globalData 读取内容来更新显示
    const { displayMode } = this.data;
    let content = '';
    if (displayMode === 'mixed') {
      content = generatingContentMixed || '';
    } else if (displayMode === 'cn') {
      content = generatingContentCn || generatingContentMixed || '';
    } else if (displayMode === 'en') {
      content = generatingContentEn || generatingContentMixed || '';
    }

    this.setData({
      generatingContentMixed: generatingContentMixed || '',
      generatingContentCn: generatingContentCn || '',
      generatingContentEn: generatingContentEn || '',
      displayContent: content
    });

    if (generatingDone) {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }

      this.setData({ isGenerating: false });
      if (generatingError) {
        wx.showToast({ title: generatingError || '生成失败', icon: 'none' });
      } else {
        wx.showToast({ title: '生成完成', icon: 'none' });
      }
    }
  },

  updateGeneratingDisplay() {
    const { displayMode } = this.data;
    const app = getApp();
    const { generatingContentMixed, generatingContentCn, generatingContentEn } = app.globalData;
    let content = '';

    if (displayMode === 'mixed') {
      content = generatingContentMixed || '';
    } else if (displayMode === 'cn') {
      content = generatingContentCn || generatingContentMixed || '';
    } else if (displayMode === 'en') {
      content = generatingContentEn || generatingContentMixed || '';
    }

    this.setData({ displayContent: content });
  },

  loadArticle: async function(id) {
    this.setData({ loading: true });
    try {
      const article = await getArticleDetail(id);
      this.setData({ article, loading: false });
      this.updateDisplayContent();
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    const app = getApp();
    const { generatingContentMixed, generatingContentCn, generatingContentEn } = app.globalData;

    console.log('[read] onModeChange:', mode, 'cn length:', generatingContentCn?.length, 'en length:', generatingContentEn?.length);

    // 直接从 globalData 读取内容设置显示
    let content = '';
    if (mode === 'mixed') {
      content = generatingContentMixed || '';
    } else if (mode === 'cn') {
      content = generatingContentCn || generatingContentMixed || '';
    } else if (mode === 'en') {
      content = generatingContentEn || generatingContentMixed || '';
    }

    this.setData({
      displayMode: mode,
      displayContent: content
    });
  },

  updateDisplayContent() {
    const { article, displayMode } = this.data;
    if (!article) return;

    let content = '';
    if (displayMode === 'mixed') {
      content = article.content || '';
    } else if (displayMode === 'cn') {
      content = article.contentCn || article.content || '';
    } else if (displayMode === 'en') {
      content = article.contentEn || '';
    }
    this.setData({ displayContent: content });
  },

  onFavoriteTap: async function() {
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

  onShareAppMessage() {
    const { article } = this.data;
    return {
      title: article ? article.title : '看故事背单词',
      path: '/pages/read/index?id=' + (article ? article._id : '')
    };
  },

  updateReadingProgress: async function() {
    const { article } = this.data;
    if (!article) return;
    const openid = getApp().globalData.openid;
    try {
      await updateProgress(openid, article._id, 1);
    } catch (err) {
      console.error('[read] updateProgress error:', err);
    }
  },

  onFinishTap: async function() {
    const { article } = this.data;
    const openid = getApp().globalData.openid;
    try {
      await updateProgress(openid, article._id, 2);
      wx.showToast({ title: '已标记为读完', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  onSaveTap: async function() {
    const { generatingContentMixed, generatingContentCn, generatingContentEn, generatingTopic, generatingCategory } = this.data;
    const openid = getApp().globalData.openid;
    const memberStatus = getApp().globalData.memberStatus;

    if (!generatingContentMixed.trim()) {
      wx.showToast({ title: '内容为空', icon: 'none' });
      return;
    }

    if (!memberStatus || memberStatus.type === 'free') {
      wx.showToast({ title: '注册会员保存', icon: 'none' });
      return;
    }

    const words = this.extractWords(generatingContentMixed);

    const article = {
      openid: openid,
      category: generatingCategory || 'xuanhuan',
      title: 'AI生成: ' + generatingTopic,
      content: generatingContentMixed,
      contentCn: generatingContentCn,
      contentEn: generatingContentEn,
      words: words,
      source: 'ai_generated',
      createdAt: Date.now()
    };

    try {
      const { saveArticle } = require('../../modules/article/index.js');
      const res = await saveArticle(article);

      const articleId = res?.id || res?._id;
      if (articleId) {
        const { addFavorite } = require('../../modules/progress/index.js');
        await addFavorite(openid, articleId);
      }

      wx.showToast({ title: '保存成功', icon: 'none' });
      const app = getApp();
      app.globalData.generatingContentMixed = '';
      app.globalData.generatingContentCn = '';
      app.globalData.generatingContentEn = '';
      app.globalData.generatingTopic = '';
      app.globalData.generatingCategory = '';
      app.globalData.generatingDone = false;
      setTimeout(function() {
        wx.switchTab({ url: '/pages/my/index' });
      }, 1500);
    } catch (err) {
      console.error('[read] saveArticle error:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  onCancelTap() {
    const app = getApp();
    app.globalData.generatingContentMixed = '';
    app.globalData.generatingContentCn = '';
    app.globalData.generatingContentEn = '';
    app.globalData.generatingTopic = '';
    app.globalData.generatingCategory = '';
    app.globalData.generatingDone = false;
    wx.navigateBack();
  },

  extractWords(content) {
    const words = [];
    const regex = /([A-Za-z\s]+)\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const word = match[1].trim();
      if (word && !words.includes(word)) {
        words.push(word);
      }
    }
    return words;
  }
});