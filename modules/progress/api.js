// modules/progress/api.js
// 禁止在此文件写任何业务逻辑

const { ProgressService } = require('./service.js');

async function getProgress(openid) {
  return await ProgressService.getList(openid);
}

async function updateProgress(openid, articleId, status) {
  return await ProgressService.update(openid, articleId, status);
}

async function addFavorite(openid, articleId) {
  return await ProgressService.addFavorite(openid, articleId);
}

async function removeFavorite(openid, articleId) {
  return await ProgressService.removeFavorite(openid, articleId);
}

async function getFavorites(openid) {
  return await ProgressService.getFavorites(openid);
}

module.exports = {
  getProgress,
  updateProgress,
  addFavorite,
  removeFavorite,
  getFavorites
};
