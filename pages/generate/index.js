// pages/generate/index.js
// AI生成页：选分类 + 输入主题 → 生成故事

const { generateStoryStream, cancelGenerate } = require('../../modules/ai/index.js');
const { CATEGORIES } = require('../../modules/article/model.js');
const { saveArticle } = require('../../modules/article/index.js');
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
    console.log('[generate] page loaded, categories:', CATEGORIES.length);
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
    this.updateCanGenerate(category, this.data.topic);
  },

  // 输入主题
  onTopicInput(e) {
    const topic = e.detail.value;
    this.setData({ topic: topic });
    this.updateCanGenerate(this.data.selectedCategory, topic);
  },

  // 更新是否可以生成
  updateCanGenerate(category, topic) {
    const canGenerate = !!(category && topic && topic.trim().length > 0);
    this.setData({ canGenerate: canGenerate });
    console.log('[generate] updateCanGenerate:', category, topic, '=>', canGenerate);
  },

  // 加载AI配额
  async loadQuota() {
    try {
      const openid = getApp().globalData.openid;
      console.log('[generate] loadQuota openid:', openid);
      if (!openid) {
        console.log('[generate] openid not ready, skipping quota load');
        return;
      }
      const quota = await useAiQuota(openid);
      console.log('[generate] quota loaded:', quota);
      this.setData({ quota: quota });
    } catch (err) {
      console.error('[generate] loadQuota error:', err);
      // 配额加载失败不影响使用，默认给5次
      this.setData({ quota: { used: 0, limit: 5, remaining: 5 } });
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

    // 通过 globalData 共享生成内容
    const app = getApp();
    app.globalData.generatingContent = '';
    app.globalData.generatingTopic = topic;
    app.globalData.generatingCategory = selectedCategory;
    app.globalData.generatingDone = false;
    app.globalData.generatingError = null;

    // 跳转到阅读页
    wx.navigateTo({
      url: '/pages/read/index?generating=1&category=' + selectedCategory + '&topic=' + encodeURIComponent(topic)
    });

    // 流式生成，内容传递给阅读页
    const self = this;
    generateStoryStream(selectedCategory, topic, {
      onChunk: function(text) {
        self.setData({
          generatedContent: self.data.generatedContent + text
        });
        // 更新全局数据，供阅读页轮询
        app.globalData.generatingContent += text;
      },
      onDone: async function() {
        self.setData({ generating: false });
        app.globalData.generatingDone = true;
        wx.showToast({ title: '生成完成', icon: 'none' });
      },
      onError: function(err) {
        console.error('[generate] onError:', err);
        self.setData({
          generating: false,
          error: err.message || '生成失败'
        });
        app.globalData.generatingDone = true;
        app.globalData.generatingError = err.message;
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
      // 提取 contentCn（全中文）、contentEn（纯英文）、words（单词列表）
      const contentCn = this.extractContentCn(generatedContent);
      const words = this.extractWords(generatedContent);
      const contentEn = words.join(' ');

      console.log('[generate] words:', words);
      console.log('[generate] contentCn:', contentCn);
      console.log('[generate] contentEn:', contentEn);

      const article = {
        openid,
        category: selectedCategory,
        title: 'AI生成: ' + topic,
        content: generatedContent,
        contentCn: contentCn,
        contentEn: contentEn,
        words: words,
        source: 'ai_generated',
        createdAt: Date.now()
      };

      const res = await saveArticle(article);
      console.log('[generate] article saved, res:', res);
      const generatedId = res?.id || res?._id;
      this.setData({ generatedId });
    } catch (err) {
      console.error('[generate] saveArticle error:', err);
    }
  },

  // 从内容中提取单词（支持两种格式：career(事业) 和 [career]）
  extractWords(content) {
    const words = [];

    // 格式1: career(事业)
    const regex1 = /([A-Za-z\s]+)\(([^)]+)\)/g;
    let match;
    while ((match = regex1.exec(content)) !== null) {
      const word = match[1].trim();
      if (word && !words.includes(word)) {
        words.push(word);
      }
    }

    // 格式2: [career]
    const regex2 = /\[([^\]]+)\]/g;
    while ((match = regex2.exec(content)) !== null) {
      const word = match[1].trim();
      if (word && !words.includes(word)) {
        words.push(word);
      }
    }

    return words;
  },

  // 提取中文内容（去掉英文单词和括号中的解释）
  extractContentCn(content) {
    // 去掉 career(事业) 格式，保留中文解释
    return content.replace(/[A-Za-z\s]+\(([^)]+)\)/g, '$1');
  },

  // 查看生成结果
  onViewResultTap() {
    wx.navigateTo({
      url: '/pages/read/index?id=' + this.data.generatedId
    });
  }
});
