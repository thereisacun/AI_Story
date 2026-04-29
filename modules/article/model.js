// modules/article/model.js
// 禁止在此文件写任何执行逻辑

const ArticleModel = {
  status: {
    UNREAD: 0,
    READING: 1,
    FINISHED: 2,
  },
  fields: {
    id: 'string',
    title: 'string',
    category: 'string',
    content: 'string',       // 中英夹杂
    contentCn: 'string',    // 全中文
    contentEn: 'string',
    words: 'array',
    status: 'number',
    createdAt: 'number'
  }
};

// 分类常量
const CATEGORIES = [
  { id: 'xuanhuan', name: '玄幻修仙', icon: '🧙' },
  { id: 'city', name: '都市异能', icon: '🏙️' },
  { id: 'history', name: '历史穿越', icon: '🏯' },
  { id: 'apocalypse', name: '末日逃生', icon: '🧟' }
];

// 显示模式常量
const DISPLAY_MODE = {
  MIXED: 'mixed',     // 中英夹杂
  CN_ONLY: 'cn',      // 全中文
  EN_ONLY: 'en'       // 全英文
};

module.exports = {
  ArticleModel,
  CATEGORIES,
  DISPLAY_MODE
};
