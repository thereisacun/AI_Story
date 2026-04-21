// app.js
// AI短文记单词 - 全局入口

App({
  globalData: {
    userInfo: null,
    openid: '',
    memberStatus: {
      type: 'free', // free/trial/month/season/year
      expireTime: null,
      activatedAt: null
    },
    aiQuota: {
      used: 0,
      limit: 5 // 免费用户每天5次
    }
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'test-3gx8xmztd4d205b5',
        traceUser: true
      });
    }

    // 获取用户openid
    this.getOpenid();

    // 加载本地缓存的会员状态
    this.loadMemberStatus();
  },

  async getOpenid() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenid'
      });
      this.globalData.openid = result.openid;
    } catch (err) {
      console.error('[app] getOpenid failed:', err);
    }
  },

  loadMemberStatus() {
    const cached = wx.getStorageSync('memberStatus');
    if (cached) {
      this.globalData.memberStatus = cached;
    }
  },

  updateMemberStatus(status) {
    this.globalData.memberStatus = status;
    wx.setStorageSync('memberStatus', status);
  }
});