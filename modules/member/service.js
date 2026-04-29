// modules/member/service.js
// 唯一包含async/await的层，调用utils

const { getDB } = require('../../utils/db.js');
const { storage } = require('../../utils/storage.js');
const { CDK_CONFIGS, MEMBER_TYPE, MEMBER_BENEFITS } = require('./model.js');

const MemberService = {
  // 获取会员状态
  async getStatus(openid) {
    // 先查本地缓存
    const cached = storage.get('memberStatus');
    if (cached) {
      return cached;
    }

    // 从数据库查询
    try {
      const db = await getDB();
      const res = await db.collection('user_member')
        .where({ openid })
        .get();

      if (res.data.length > 0) {
        const status = res.data[0];
        storage.set('memberStatus', status);
        return status;
      }
    } catch (err) {
      console.error('[member] getStatus error:', err);
    }

    // 返回默认免费状态
    return {
      type: MEMBER_TYPE.FREE,
      expireTime: null,
      activatedAt: null
    };
  },

  // 激活CDK（调用云函数）
  async activate(cdk, openid) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'handleActivation',
        data: { code: cdk, openid }
      });

      if (!result.success) {
        throw new Error(result.error || '激活失败');
      }

      // 更新本地缓存
      const memberData = {
        type: result.data.memberType,
        expireTime: result.data.expireTime,
        activatedAt: Date.now()
      };
      storage.set('memberStatus', memberData);

      return memberData;
    } catch (err) {
      console.error('[member] activate error:', err);
      throw err;
    }
  },

  // 获取AI配额
  async getQuota(openid) {
    const status = await this.getStatus(openid);
    const benefit = MEMBER_BENEFITS[status.type] || MEMBER_BENEFITS[MEMBER_TYPE.FREE];

    // 获取已使用次数
    const used = storage.get('aiQuotaUsed') || 0;

    return {
      used,
      limit: benefit.aiQuota,
      remaining: Math.max(0, benefit.aiQuota - used)
    };
  },

  // 消耗AI配额
  async consumeQuota(openid) {
    const quota = await this.getQuota(openid);

    if (quota.remaining <= 0) {
      throw new Error('今日配额已用完，请明天再试或开通会员');
    }

    const used = (storage.get('aiQuotaUsed') || 0) + 1;
    storage.set('aiQuotaUsed', used);

    return {
      used,
      limit: quota.limit,
      remaining: quota.limit - used
    };
  },

  // 重置每日配额（每天零点调用）
  resetDailyQuota() {
    const lastReset = storage.get('aiQuotaResetDate');
    const today = new Date().toDateString();

    if (lastReset !== today) {
      storage.set('aiQuotaUsed', 0);
      storage.set('aiQuotaResetDate', today);
    }
  }
};

module.exports = { MemberService };
