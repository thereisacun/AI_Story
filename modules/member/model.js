// modules/member/model.js
// 禁止在此文件写任何执行逻辑

const MEMBER_TYPE = {
  FREE: 'free',       // 未激活/免费用户
  TRIAL: 'trial',     // 试用7天
  MONTH: 'month',     // 月卡
  SEASON: 'season',   // 季卡
  YEAR: 'year'        // 年卡
};

// 会员权益配置
const MEMBER_BENEFITS = {
  FREE: {
    aiQuota: 5,        // 每天5次
    description: '免费用户'
  },
  TRIAL: {
    aiQuota: 10,
    description: '7天试用'
  },
  MONTH: {
    aiQuota: 50,
    description: '月卡会员'
  },
  SEASON: {
    aiQuota: 150,
    description: '季卡会员'
  },
  YEAR: {
    aiQuota: 365,
    description: '年卡会员'
  }
};

// CDK配置（实际部署时这些值应该存在云端）
const CDK_CONFIGS = {
  'MONTH01': { type: 'month', days: 30 },
  'SEASON01': { type: 'season', days: 90 },
  'YEAR01': { type: 'year', days: 365 }
};

module.exports = {
  MEMBER_TYPE,
  MEMBER_BENEFITS,
  CDK_CONFIGS
};
