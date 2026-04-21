// modules/member/service.js
// 唯一包含async/await的层，调用utils

import { db } from '../../utils/db.js';
import { storage } from '../../utils/storage.js';
import { CDK_CONFIGS, MEMBER_TYPE, MEMBER_BENEFITS } from './model.js';

export const MemberService = {
  // 获取会员状态
  async getStatus(openid) {
    // 先查本地缓存
    const cached = storage.get('memberStatus');
    if (cached) {
      return cached;
    }

    // 从数据库查询
    try {
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

  // 激活CDK
  async activate(cdk, openid) {
    const config = CDK_CONFIGS[cdk];
    if (!config) {
      throw new Error('无效的激活码');
    }

    const now = Date.now();
    const expireTime = now + config.days * 24 * 60 * 60 * 1000;

    const memberData = {
      openid,
      type: config.type,
      expireTime,
      activatedAt: now
    };

    // 保存到数据库
    await db.collection('user_member')
      .where({ openid })
      .update({
        data: memberData
      }).catch(() => {
        // 不存在则新增
        return db.collection('user_member').add({ data: memberData });
      });

    // 更新本地缓存
    storage.set('memberStatus', memberData);

    return memberData;
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