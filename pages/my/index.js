// pages/my/index.js
// 我的：进度、收藏、分享历史、会员状态

const { checkMemberStatus } = require('../../modules/member/index.js');
const { getFavorites } = require('../../modules/progress/index.js');
const { MEMBER_TYPE, MEMBER_BENEFITS } = require('../../modules/member/model.js');

Page({
  data: {
    memberStatus: null,
    memberType: MEMBER_TYPE,
    benefits: MEMBER_BENEFITS,
    favorites: []
  },

  onLoad() {
    this.loadMemberStatus();
  },

  onShow() {
    this.loadFavorites();
    this.loadMemberStatus();
  },

  // 加载会员状态
  async loadMemberStatus() {
    try {
      const openid = getApp().globalData.openid;
      if (!openid) {
        console.log('[my] openid not ready yet');
        return;
      }
      const status = await checkMemberStatus(openid);
      this.setData({ memberStatus: status });
    } catch (err) {
      console.error('[my] loadMemberStatus error:', err);
    }
  },

  // 加载收藏列表
  async loadFavorites() {
    try {
      const openid = getApp().globalData.openid;
      if (!openid) {
        console.log('[my] openid not ready yet');
        return;
      }
      const favorites = await getFavorites(openid);
      this.setData({ favorites });
    } catch (err) {
      console.error('[my] loadFavorites error:', err);
    }
  },

  // 跳转激活页面
  onActivateTap() {
    wx.navigateTo({
      url: '/pages/activation/index'
    });
  },

  // 跳转到文章
  onArticleTap(e) {
    const articleId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/read/index?id=' + articleId
    });
  },

  // 格式化日期
  formatDate(timestamp) {
    if (!timestamp) return '未激活';
    const date = new Date(timestamp);
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
});
