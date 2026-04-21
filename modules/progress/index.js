// modules/progress/index.js
// 禁止在此文件写任何业务逻辑

export { getProgress, updateProgress, addFavorite, removeFavorite, getFavorites } from './api.js';
export { ProgressModel } from './model.js';
export { ProgressService } from './service.js';