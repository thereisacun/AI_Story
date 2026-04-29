// modules/article/api.js
// 禁止在此文件写任何业务逻辑

const { ArticleService } = require('./service.js');

async function fetchArticleList(category) {
  try {
    return await ArticleService.getListByCategory(category);
  } catch (err) {
    console.error('[article] fetchArticleList error:', err);
    throw err;
  }
}

async function getArticleDetail(id) {
  try {
    return await ArticleService.getById(id);
  } catch (err) {
    console.error('[article] getArticleDetail error:', err);
    throw err;
  }
}

async function saveArticle(article) {
  try {
    return await ArticleService.save(article);
  } catch (err) {
    console.error('[article] saveArticle error:', err);
    throw err;
  }
}

module.exports = {
  fetchArticleList,
  getArticleDetail,
  saveArticle
};
