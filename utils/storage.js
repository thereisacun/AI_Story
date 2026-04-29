// utils/storage.js
// 本地存储封装

/**
 * 获取本地存储
 * @param {string} key - 存储键名
 * @returns {any} 存储的值，如果不存在返回null
 */
function get(key) {
  try {
    const value = wx.getStorageSync(key);
    return value || null;
  } catch (err) {
    console.error('[storage] get error:', err);
    return null;
  }
}

/**
 * 设置本地存储
 * @param {string} key - 存储键名
 * @param {any} value - 存储的值
 */
function set(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (err) {
    console.error('[storage] set error:', err);
  }
}

/**
 * 移除本地存储
 * @param {string} key - 存储键名
 */
function remove(key) {
  try {
    wx.removeStorageSync(key);
  } catch (err) {
    console.error('[storage] remove error:', err);
  }
}

/**
 * 清空所有本地存储（谨慎使用）
 */
function clear() {
  try {
    wx.clearStorageSync();
  } catch (err) {
    console.error('[storage] clear error:', err);
  }
}

/**
 * 获取存储信息
 */
function getInfo() {
  try {
    return wx.getStorageInfoSync();
  } catch (err) {
    console.error('[storage] getInfo error:', err);
    return null;
  }
}

module.exports = {
  get,
  set,
  remove,
  clear,
  getInfo
};
