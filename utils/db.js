// utils/db.js
// 数据库操作封装

/**
 * 云开发数据库实例（带重试，解决初始化时序问题）
 */
async function getDB() {
  console.log('[db] getDB called');
  const maxRetries = 20;
  const delayMs = 200;

  for (let i = 0; i < maxRetries; i++) {
    try {
      if (!wx.cloud) {
        console.log('[db] wx.cloud not ready, attempt', i + 1);
        await new Promise(function(resolve) { setTimeout(resolve, delayMs); });
        continue;
      }

      const db = wx.cloud.database();

      if (db && typeof db.collection === 'function') {
        console.log('[db] got valid db at attempt', i + 1);
        return db;
      }
      console.log('[db] invalid db at attempt', i + 1);
    } catch (err) {
      console.log('[db] error at attempt', i + 1, ':', err.message || err.errMsg);
    }
    await new Promise(function(resolve) { setTimeout(resolve, delayMs); });
  }
  throw new Error('wx.cloud.database() not available after retries');
}

/**
 * 通用查询
 */
async function query(collectionName, conditions) {
  try {
    const db = await getDB();
    let q = db.collection(collectionName);

    if (conditions.where) {
      q = q.where(conditions.where);
    }
    if (conditions.orderBy) {
      q = q.orderBy(conditions.orderBy.field, conditions.orderBy.order);
    }
    if (conditions.limit) {
      q = q.limit(conditions.limit);
    }
    if (conditions.skip) {
      q = q.skip(conditions.skip);
    }

    return await q.get();
  } catch (err) {
    console.error('[db] query error:', err);
    throw err;
  }
}

/**
 * 通用新增
 */
async function add(collectionName, data) {
  return await (await getDB()).collection(collectionName).add({ data });
}

/**
 * 通用更新
 */
async function update(collectionName, conditions, data) {
  return await (await getDB()).collection(collectionName)
    .where(conditions)
    .update({ data });
}

/**
 * 通用删除
 */
async function remove(collectionName, conditions) {
  return await (await getDB()).collection(collectionName)
    .where(conditions)
    .remove();
}

/**
 * 根据ID获取单条记录
 */
async function getById(collectionName, id) {
  return await (await getDB()).collection(collectionName).doc(id).get();
}

module.exports = {
  getDB,
  query,
  add,
  update,
  remove,
  getById
};
