// modules/article/index.js
// 禁止在此文件写任何业务逻辑

const { fetchArticleList, getArticleDetail, saveArticle } = require('./api.js');
const { ArticleModel, CATEGORIES, DISPLAY_MODE } = require('./model.js');
const { ArticleService } = require('./service.js');

module.exports = {
  fetchArticleList,
  getArticleDetail,
  saveArticle,
  ArticleModel,
  CATEGORIES,
  DISPLAY_MODE
};
