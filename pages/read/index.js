// pages/read/index.js
// 阅读页：短文展示 + 三种显示模式切换

const { getArticleDetail } = require('../../modules/article/index.js');
const { DISPLAY_MODE } = require('../../modules/article/model.js');
const { updateProgress, addFavorite, removeFavorite } = require('../../modules/progress/index.js');

Page({
  data: {
    article: null,
    displayMode: DISPLAY_MODE.MIXED, // 默认中英夹杂
    isFavorite: false,
    loading: true,
    displayContent: '',
    isFromAI: false,  // 是否来自AI生成
    isGenerating: false,  // AI是否正在生成
    generatingTopic: '',
    generatingCategory: '',
    generatingContent: '',
    pollingTimer: null
  },

  onLoad(options) {
    const { id, generating, category, topic } = options;

    // 如果是AI生成模式
    if (generating === '1' && category && topic) {
      this.setData({
        isFromAI: true,
        isGenerating: true,
        generatingTopic: decodeURIComponent(topic),
        generatingCategory: category,
        loading: false
      });
      // 启动轮询获取生成内容
      this.startPollingGeneratingContent();
      return;
    }

    // 正常阅读模式
    if (id) {
      this.loadArticle(id);
    }
  },

  onUnload() {
    // 停止轮询
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  },

  onShow() {
    // 页面展示时更新阅读进度
    this.updateReadingProgress();
  },

  // 启动轮询获取生成内容
  startPollingGeneratingContent() {
    const self = this;
    const app = getApp();

    // 立即检查一次
    this.checkGeneratingContent();

    // 每500ms轮询一次
    this.pollingTimer = setInterval(function() {
      self.checkGeneratingContent();
    }, 500);
  },

  // 检查生成内容状态
  checkGeneratingContent() {
    const app = getApp();
    const { generatingDone, generatingError, generatingContent } = app.globalData;

    // 更新内容
    if (generatingContent !== undefined) {
      this.setData({
        generatingContent: generatingContent
      });
      this.updateGeneratingDisplay();
    }

    // 检查是否完成
    if (generatingDone) {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }

      if (generatingError) {
        this.setData({ isGenerating: false });
        wx.showToast({ title: generatingError || '生成失败', icon: 'none' });
      } else {
        this.setData({ isGenerating: false });
        wx.showToast({ title: '生成完成', icon: 'none' });
      }
    }
  },

  // 更新生成内容的显示
  updateGeneratingDisplay() {
    const { displayMode, generatingContent } = this.data;
    let content = '';

    if (displayMode === DISPLAY_MODE.MIXED) {
      content = generatingContent;
    } else if (displayMode === DISPLAY_MODE.CN_ONLY) {
      content = this.extractContentCn(generatingContent);
    } else if (displayMode === DISPLAY_MODE.EN_ONLY) {
      content = this.extractContentEn(generatingContent);
    }

    this.setData({ displayContent: content });
  },

  // 提取中文内容（去掉英文单词和括号中的解释）
  extractContentCn(content) {
    return content.replace(/[A-Za-z\s]+\(([^)]+)\)/g, '$1');
  },

  // 提取纯英文单词
  extractContentEn(content) {
    const words = [];
    const regex = /([A-Za-z\s]+)\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const word = match[1].trim();
      if (word && !words.includes(word)) {
        words.push(word);
      }
    }
    return words.join(' ');
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
      this.updateDisplayContent();
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 切换显示模式
  onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ displayMode: mode });

    // 如果是生成模式，更新生成内容的显示
    if (this.data.isGenerating) {
      this.updateGeneratingDisplay();
    } else {
      this.updateDisplayContent();
    }
  },

  // 更新显示内容（正常阅读模式）
  updateDisplayContent() {
    const { article, displayMode } = this.data;
    if (!article) return;

    let content = '';
    if (displayMode === DISPLAY_MODE.MIXED) {
      content = article.content || '';
    } else if (displayMode === DISPLAY_MODE.CN_ONLY) {
      content = article.contentCn || article.content || '';
    } else if (displayMode === DISPLAY_MODE.EN_ONLY) {
      content = article.contentEn || '';
    }
    this.setData({ displayContent: content });
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
      title: article ? article.title : 'AI短文记单词',
      path: '/pages/read/index?id=' + (article ? article._id : '')
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

  // 保存生成的短文
  async onSaveTap() {
    const { generatingContent, generatingTopic, generatingCategory } = this.data;
    const openid = getApp().globalData.openid;
    const memberStatus = getApp().globalData.memberStatus;

    if (!generatingContent.trim()) {
      wx.showToast({ title: '内容为空', icon: 'none' });
      return;
    }

    // 非会员提示
    if (!memberStatus || memberStatus.type === 'free') {
      wx.showToast({ title: '注册会员保存', icon: 'none' });
      return;
    }

    // 提取 contentCn、contentEn、words
    const contentCn = this.extractContentCn(generatingContent);
    const words = this.extractWords(generatingContent);
    const contentEn = words.join(' ');

    const article = {
      openid: openid,
      category: generatingCategory || 'xuanhuan',
      title: 'AI生成: ' + generatingTopic,
      content: generatingContent,
      contentCn: contentCn,
      contentEn: contentEn,
      words: words,
      source: 'ai_generated',
      createdAt: Date.now()
    };

    console.log('[read] saving article:', article);

    try {
      // 先保存到 ai_generated 集合
      const { saveArticle } = require('../../modules/article/index.js');
      const res = await saveArticle(article);
      console.log('[read] saveArticle res:', res);

      // 获取文章ID添加到收藏
      const articleId = res?.id || res?._id;
      if (articleId) {
        const { addFavorite } = require('../../modules/progress/index.js');
        await addFavorite(openid, articleId);
        console.log('[read] added to favorites:', articleId);
      }

      wx.showToast({ title: '保存成功', icon: 'none' });
      // 清理全局数据
      const app = getApp();
      app.globalData.generatingContent = '';
      app.globalData.generatingTopic = '';
      app.globalData.generatingCategory = '';
      app.globalData.generatingDone = false;
      // 跳转到我的页面
      setTimeout(function() {
        wx.switchTab({ url: '/pages/my/index' });
      }, 1500);
    } catch (err) {
      console.error('[read] saveArticle error:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 取消生成
  onCancelTap() {
    // 清理全局数据
    const app = getApp();
    app.globalData.generatingContent = '';
    app.globalData.generatingTopic = '';
    app.globalData.generatingCategory = '';
    app.globalData.generatingDone = false;
    wx.navigateBack();
  },

  // 提取单词列表（支持新格式 career(事业)）
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
  },

  });
