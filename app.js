// app.js
// 看故事背单词 - 全局入口

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
    console.log('[app] onLaunch called');

    // 初始化云开发
    if (!wx.cloud) {
      console.error('[app] wx.cloud is undefined, please use baseline library >= 2.2.3');
    } else {
      wx.cloud.init({
        env: 'test-3gx8xmztd4d205b5',
        traceUser: true
      });
      console.log('[app] wx.cloud.init called');
    }

    // 获取用户openid（暂时跳过，等部署getOpenid云函数）
    // this.getOpenid();

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
      this.globalData.openid = 'temp_openid_' + Date.now();
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
