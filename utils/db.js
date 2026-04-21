// utils/db.js
// 数据库操作封装

/**
 * 云开发数据库实例
 */
export const db = wx.cloud.database();

/**
 * 通用查询
 */
export async function query(collectionName, conditions = {}) {
  try {
    let query = db.collection(collectionName);

    // 处理where条件
    if (conditions.where) {
      query = query.where(conditions.where);
    }

    // 处理orderBy
    if (conditions.orderBy) {
      query = query.orderBy(conditions.orderBy.field, conditions.orderBy.order);
    }

    // 处理limit
    if (conditions.limit) {
      query = query.limit(conditions.limit);
    }

    // 处理skip
    if (conditions.skip) {
      query = query.skip(conditions.skip);
    }

    return await query.get();
  } catch (err) {
    console.error('[db] query error:', err);
    throw err;
  }
}

/**
 * 通用新增
 */
export async function add(collectionName, data) {
  return await db.collection(collectionName).add({ data });
}

/**
 * 通用更新
 */
export async function update(collectionName, conditions, data) {
  return await db.collection(collectionName)
    .where(conditions)
    .update({ data });
}

/**
 * 通用删除
 */
export async function remove(collectionName, conditions) {
  return await db.collection(collectionName)
    .where(conditions)
    .remove();
}

/**
 * 根据ID获取单条记录
 */
export async function getById(collectionName, id) {
  return await db.collection(collectionName).doc(id).get();
}