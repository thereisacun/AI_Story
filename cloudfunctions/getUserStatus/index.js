// cloudfunctions/getUserStatus/index.js
// 获取用户会员状态

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 会员权益配置
const MEMBER_BENEFITS = {
  free: { aiQuota: 5, description: '免费用户' },
  trial: { aiQuota: 10, description: '7天试用' },
  month: { aiQuota: 50, description: '月卡会员' },
  season: { aiQuota: 150, description: '季卡会员' },
  year: { aiQuota: 365, description: '年卡会员' }
}

exports.main = async (event, context) => {
  const { openid } = event

  if (!openid) {
    return { success: false, error: '参数不完整' }
  }

  try {
    // 查询用户会员状态
    const res = await db.collection('users')
      .where({ openid })
      .get()

    if (res.data.length === 0) {
      // 用户不存在，返回免费状态
      return {
        success: true,
        data: {
          memberType: 'free',
          expireTime: null,
          isActive: false,
          benefits: MEMBER_BENEFITS.free
        }
      }
    }

    const userInfo = res.data[0]
    const now = Date.now()
    const isActive = userInfo.expireTime && userInfo.expireTime > now
    const memberType = isActive ? userInfo.memberType : 'free'

    return {
      success: true,
      data: {
        memberType,
        expireTime: userInfo.expireTime || null,
        isActive,
        activatedAt: userInfo.activatedAt || null,
        benefits: MEMBER_BENEFITS[memberType] || MEMBER_BENEFITS.free
      }
    }

  } catch (err) {
    console.error('[getUserStatus] error:', err)
    return { success: false, error: '查询失败' }
  }
}
