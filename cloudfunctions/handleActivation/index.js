// cloudfunctions/handleActivation/index.js
// 处理激活码兑换

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 会员类型映射
const MEMBER_TYPE_DAYS = {
  trial: 7,
  month: 30,
  season: 90,
  year: 365
}

exports.main = async (event, context) => {
  const { code, openid } = event

  // 参数校验
  if (!code || !openid) {
    return { success: false, error: '参数不完整' }
  }

  const codeUpper = code.toUpperCase().trim()

  try {
    // 1. 查询激活码
    const codeRes = await db.collection('activation_codes')
      .where({ code: codeUpper })
      .get()

    if (codeRes.data.length === 0) {
      // 记录失败日志
      await logActivation(codeUpper, openid, false, '激活码不存在')
      return { success: false, error: '激活码不存在' }
    }

    const codeInfo = codeRes.data[0]

    // 2. 检查激活码状态
    if (codeInfo.status === 'used') {
      await logActivation(codeUpper, openid, false, '激活码已被使用')
      return { success: false, error: '激活码已被使用' }
    }

    if (codeInfo.status === 'expired') {
      await logActivation(codeUpper, openid, false, '激活码已过期')
      return { success: false, error: '激活码已过期' }
    }

    // 3. 计算新的到期时间
    const now = Date.now()
    const days = MEMBER_TYPE_DAYS[codeInfo.type] || 30
    const newExpireTime = now + days * 24 * 60 * 60 * 1000

    // 4. 查询用户当前状态
    const userRes = await db.collection('users')
      .where({ openid })
      .get()

    let userMemberData = {
      openid,
      memberType: codeInfo.type,
      expireTime: newExpireTime,
      activatedAt: now,
      cdk: codeUpper
    }

    if (userRes.data.length > 0) {
      // 已存在用户，合并会员时间
      const existingUser = userRes.data[0]
      const existingExpireTime = existingUser.expireTime || 0

      // 如果当前会员未过期，累加时间；否则从现在起算
      const baseTime = existingExpireTime > now ? existingExpireTime : now
      userMemberData.expireTime = baseTime + days * 24 * 60 * 60 * 1000
      userMemberData.activatedAt = now
      userMemberData.cdk = codeUpper

      // 更新用户记录
      await db.collection('users')
        .where({ openid })
        .update({ data: userMemberData })
    } else {
      // 新用户，新增记录
      await db.collection('users').add({ data: userMemberData })
    }

    // 5. 更新激活码状态
    await db.collection('activation_codes')
      .where({ code: codeUpper })
      .update({
        data: {
          status: 'used',
          usedBy: openid,
          usedAt: now
        }
      })

    // 6. 记录成功日志
    await logActivation(codeUpper, openid, true, null)

    return {
      success: true,
      data: {
        memberType: codeInfo.type,
        expireTime: userMemberData.expireTime,
        days
      }
    }

  } catch (err) {
    console.error('[handleActivation] error:', err)
    await logActivation(codeUpper, openid, false, err.message)
    return { success: false, error: '激活失败，请稍后重试' }
  }
}

// 记录激活日志
async function logActivation(code, openid, success, errorMsg) {
  try {
    await db.collection('activation_logs').add({
      data: {
        code,
        openid,
        success,
        errorMsg,
        timestamp: Date.now()
      }
    })
  } catch (err) {
    console.error('[logActivation] error:', err)
  }
}
