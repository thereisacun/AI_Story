// cloudfunctions/getOpenid/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext()
    return {
      openid: OPENID
    }
  } catch (err) {
    return {
      error: err.message,
      openid: null
    }
  }
}
