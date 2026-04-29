// pages/generate/index.js
// AI生成页：选分类 + 输入主题 → 生成故事（流式输出mixed版本，同时生成cn/en版本）

const { generateStoryStream, cancelGenerate, generateStory } = require('../../modules/ai/index.js');
const { CATEGORIES } = require('../../modules/article/model.js');
const { useAiQuota } = require('../../modules/member/index.js');

Page({
  data: {
    categories: CATEGORIES,
    selectedCategory: null,
    topic: '',
    generating: false,
    generatedContent: '',
    quota: null,
    error: null,
    canGenerate: false
  },

  onLoad() {
    this.loadQuota();
  },

  onUnload() {
    if (this.data.generating) {
      cancelGenerate();
    }
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ selectedCategory: category });
    this.updateCanGenerate(category, this.data.topic);
  },

  onTopicInput(e) {
    const topic = e.detail.value;
    this.setData({ topic: topic });
    this.updateCanGenerate(this.data.selectedCategory, topic);
  },

  updateCanGenerate(category, topic) {
    const canGenerate = !!(category && topic && topic.trim().length > 0);
    this.setData({ canGenerate: canGenerate });
  },

  async loadQuota() {
    try {
      const openid = getApp().globalData.openid;
      if (!openid) return;
      const quota = await useAiQuota(openid);
      this.setData({ quota: quota });
    } catch (err) {
      this.setData({ quota: { used: 0, limit: 5, remaining: 5 } });
    }
  },

  // 开始生成
  async onGenerateTap() {
    const { selectedCategory, topic, generating, quota } = this.data;

    if (!selectedCategory) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }
    if (!topic.trim()) {
      wx.showToast({ title: '请输入主题', icon: 'none' });
      return;
    }
    if (generating) {
      return;
    }
    if (quota && quota.remaining <= 0) {
      wx.showToast({ title: '今日配额已用完', icon: 'none' });
      return;
    }

    this.setData({ generating: true, generatedContent: '', error: null });

    const app = getApp();
    app.globalData.generatingContentMixed = '';
    app.globalData.generatingContentCn = '';
    app.globalData.generatingContentEn = '';
    app.globalData.generatingTopic = topic;
    app.globalData.generatingCategory = selectedCategory;
    app.globalData.generatingDone = false;
    app.globalData.generatingError = null;

    // 跳转到阅读页
    wx.navigateTo({
      url: '/pages/read/index?generating=1&category=' + selectedCategory + '&topic=' + encodeURIComponent(topic)
    });

    // 同时开始生成三个版本
    const self = this;

    // 1. 流式生成 mixed 版本（实时显示）
    generateStoryStream(selectedCategory, topic, 'mixed', {
      onChunk: function(text) {
        app.globalData.generatingContentMixed += text;
      },
      onDone: function() {
        app.globalData.generatingDone = true;
        self.setData({ generating: false });
        wx.showToast({ title: '生成完成', icon: 'none' });
      },
      onError: function(err) {
        console.error('[generate] mixed onError:', err);
        self.setData({
          generating: false,
          error: err.message || '生成失败'
        });
        app.globalData.generatingDone = true;
        app.globalData.generatingError = err.message;
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });

    // 2. 后台生成 cn 版本
    this.generateVersion(selectedCategory, topic, 'cn').then(content => {
      app.globalData.generatingContentCn = content;
      console.log('[generate] cn version generated, length:', content?.length);
      console.log('[generate] cn content preview:', content?.substring(0, 100));
    }).catch(err => {
      console.error('[generate] cn version error:', err);
    });

    // 3. 后台生成 en 版本
    this.generateVersion(selectedCategory, topic, 'en').then(content => {
      app.globalData.generatingContentEn = content;
      console.log('[generate] en version generated, length:', content?.length);
      console.log('[generate] en content preview:', content?.substring(0, 100));
    }).catch(err => {
      console.error('[generate] en version error:', err);
    });
  },

  // 生成单个版本
  async generateVersion(category, topic, mode) {
    try {
      return await generateStory(category, topic, mode);
    } catch (err) {
      console.error('[generate] generateVersion error:', err);
      return '';
    }
  },

  onCancelTap() {
    cancelGenerate();
    this.setData({ generating: false });
  }
});