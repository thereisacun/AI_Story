// modules/progress/index.js
// 禁止在此文件写任何业务逻辑

const { getProgress, updateProgress, addFavorite, removeFavorite, getFavorites } = require('./api.js');
const { ProgressModel } = require('./model.js');
const { ProgressService } = require('./service.js');

module.exports = {
  getProgress,
  updateProgress,
  addFavorite,
  removeFavorite,
  getFavorites,
  ProgressModel
};
