// pages/my/index.js
// 我的：进度、收藏、分享历史、会员状态、激活码

import { checkMemberStatus, activateCDK } from '../../../modules/member/index.js';
import { getFavorites } from '../../../modules/progress/index.js';
import { MEMBER_TYPE, MEMBER_BENEFITS } from '../../../modules/member/model.js';

Page({
  data: {
    memberStatus: null,
    memberType: MEMBER_TYPE,
    benefits: MEMBER_BENEFITS,
    favorites: [],
    cdkInput: '',
    activating: false
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
      const favorites = await getFavorites(openid);
      this.setData({ favorites });
    } catch (err) {
      console.error('[my] loadFavorites error:', err);
    }
  },

  // 输入激活码
  onCDKInput(e) {
    this.setData({ cdkInput: e.detail.value });
  },

  // 激活CDK
  async onActivateTap() {
    const { cdkInput, activating } = this.data;

    if (!cdkInput.trim()) {
      wx.showToast({ title: '请输入激活码', icon: 'none' });
      return;
    }
    if (activating) return;

    this.setData({ activating: true });

    try {
      const openid = getApp().globalData.openid;
      const newStatus = await activateCDK(cdkInput.trim(), openid);

      this.setData({
        memberStatus: newStatus,
        cdkInput: '',
        activating: false
      });

      wx.showToast({ title: '激活成功', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: err.message || '激活失败', icon: 'none' });
      this.setData({ activating: false });
    }
  },

  // 跳转到文章
  onArticleTap(e) {
    const articleId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/read/index?id=${articleId}`
    });
  },

  // 格式化日期
  formatDate(timestamp) {
    if (!timestamp) return '未激活';
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
});