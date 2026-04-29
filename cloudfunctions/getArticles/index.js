const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const { category, id, action, openid, article, page = 1, pageSize = 10 } = event

  try {
    // 按ID查询（优先，更快）
    if (id) {
      return await db.collection('articles').doc(id).get()
    }

    // 按分类查询
    if (category) {
      return await db.collection('articles')
        .where({ category })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
    }

    // 保存AI生成的文章
    if (action === 'add' && article) {
      return await db.collection('ai_generated').add({
        data: {
          ...article,
          createdAt: db.serverDate()
        }
      })
    }

    // 获取AI生成的文章列表（去掉orderBy避免索引问题）
    if (action === 'generated' && openid) {
      return await db.collection('ai_generated')
        .where({ openid })
        .limit(50)
        .get()
    }

    return { data: [] }
  } catch (err) {
    return { error: err.message, data: [] }
  }
}
