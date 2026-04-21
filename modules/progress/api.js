// modules/progress/api.js
// 禁止在此文件写任何业务逻辑

import { ProgressService } from './service.js';

export async function getProgress(openid) {
  return await ProgressService.getList(openid);
}

export async function updateProgress(openid, articleId, status) {
  return await ProgressService.update(openid, articleId, status);
}

export async function addFavorite(openid, articleId) {
  return await ProgressService.addFavorite(openid, articleId);
}

export async function removeFavorite(openid, articleId) {
  return await ProgressService.removeFavorite(openid, articleId);
}

export async function getFavorites(openid) {
  return await ProgressService.getFavorites(openid);
}