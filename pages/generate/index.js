// pages/generate/index.js
// AI生成页：选分类 + 输入主题 → 生成故事

import { generateStoryStream, cancelGenerate } from '../../../modules/ai/index.js';
import { CATEGORIES } from '../../../modules/article/model.js';
import { saveArticle } from '../../../modules/article/index.js';
import { useAiQuota } from '../../../modules/member/index.js';

Page({
  data: {
    categories: CATEGORIES,
    selectedCategory: null,
    topic: '',
    generating: false,
    generatedContent: '',
    quota: null,
    error: null
  },

  onLoad() {
    this.loadQuota();
  },

  onUnload() {
    // 页面卸载时取消生成
    if (this.data.generating) {
      cancelGenerate();
    }
  },

  // 选择分类
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ selectedCategory: category });
  },

  // 输入主题
  onTopicInput(e) {
    this.setData({ topic: e.detail.value });
  },

  // 加载AI配额
  async loadQuota() {
    try {
      const openid = getApp().globalData.openid;
      const quota = await useAiQuota(openid);
      this.setData({ quota });
    } catch (err) {
      this.setData({ error: err.message });
    }
  },

  // 开始生成
  async onGenerateTap() {
    const { selectedCategory, topic, generating, quota } = this.data;

    // 校验
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

    // 流式生成
    generateStoryStream(selectedCategory, topic, {
      onChunk: (text) => {
        this.setData({
          generatedContent: this.data.generatedContent + text
        });
      },
      onDone: async () => {
        this.setData({ generating: false });
        wx.showToast({ title: '生成完成', icon: 'none' });

        // 保存到数据库
        await this.saveGeneratedArticle();
      },
      onError: (err) => {
        console.error('[generate] onError:', err);
        this.setData({
          generating: false,
          error: err.message || '生成失败'
        });
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  // 取消生成
  onCancelTap() {
    cancelGenerate();
    this.setData({ generating: false });
  },

  // 保存生成的短文
  async saveGeneratedArticle() {
    const { selectedCategory, generatedContent, topic } = this.data;
    const openid = getApp().globalData.openid;

    try {
      const article = {
        openid,
        category: selectedCategory,
        title: `AI生成: ${topic}`,
        content: generatedContent,
        words: this.extractWords(generatedContent),
        source: 'ai_generated',
        createdAt: Date.now()
      };

      await saveArticle(article);
    } catch (err) {
      console.error('[generate] saveArticle error:', err);
    }
  },

  // 从内容中提取单词
  extractWords(content) {
    const regex = /\[([^\]]+)\]/g;
    const words = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      words.push(match[1]);
    }
    return words;
  },

  // 查看生成结果
  onViewResultTap() {
    wx.navigateTo({
      url: `/pages/read/index?id=${this.data.generatedId}`
    });
  }
});