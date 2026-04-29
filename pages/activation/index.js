// pages/activation/index.js
// 激活页面

const app = getApp()

Page({
  data: {
    memberStatus: null,
    memberType: 'free',
    expireTime: null,
    cdkInput: '',
    activating: false,
    benefits: {
      free: { aiQuota: 5, description: '免费用户' },
      trial: { aiQuota: 10, description: '7天试用' },
      month: { aiQuota: 50, description: '月卡会员' },
      season: { aiQuota: 150, description: '季卡会员' },
      year: { aiQuota: 365, description: '年卡会员' }
    }
  },

  onLoad() {
    this.loadUserStatus()
  },

  onShow() {
    this.loadUserStatus()
  },

  // 加载用户状态
  async loadUserStatus() {
    try {
      const openid = app.globalData.openid
      if (!openid) {
        console.log('[activation] openid not ready')
        return
      }

      const { result } = await wx.cloud.callFunction({
        name: 'getUserStatus',
        data: { openid }
      })

      if (result.success) {
        this.setData({
          memberStatus: result.data,
          memberType: result.data.memberType,
          expireTime: result.data.expireTime
        })
      }
    } catch (err) {
      console.error('[activation] loadUserStatus error:', err)
    }
  },

  // 输入激活码
  onCDKInput(e) {
    // 自动转大写
    const value = e.detail.value.toUpperCase()
    this.setData({ cdkInput: value })
  },

  // 激活按钮
  async onActivateTap() {
    const { cdkInput, activating } = this.data

    if (!cdkInput.trim()) {
      wx.showToast({ title: '请输入激活码', icon: 'none' })
      return
    }

    if (activating) return

    this.setData({ activating: true })

    try {
      const openid = app.globalData.openid

      const { result } = await wx.cloud.callFunction({
        name: 'handleActivation',
        data: {
          code: cdkInput.trim(),
          openid
        }
      })

      this.setData({ activating: false, cdkInput: '' })

      if (result.success) {
        wx.showToast({ title: '激活成功', icon: 'none' })
        // 刷新状态
        setTimeout(() => {
          this.loadUserStatus()
        }, 1500)
      } else {
        wx.showToast({ title: result.error || '激活失败', icon: 'none' })
      }
    } catch (err) {
      console.error('[activation] activate error:', err)
      wx.showToast({ title: '激活失败', icon: 'none' })
      this.setData({ activating: false })
    }
  },

  // 格式化日期
  formatDate(timestamp) {
    if (!timestamp) return '未激活'
    const date = new Date(timestamp)
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0')
  }
})
