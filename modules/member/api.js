// modules/member/api.js
// 禁止在此文件写任何业务逻辑

const { MemberService } = require('./service.js');

async function checkMemberStatus(openid) {
  return await MemberService.getStatus(openid);
}

async function activateCDK(cdk, openid) {
  return await MemberService.activate(cdk, openid);
}

async function getAiQuota(openid) {
  return await MemberService.getQuota(openid);
}

async function useAiQuota(openid) {
  return await MemberService.consumeQuota(openid);
}

module.exports = {
  checkMemberStatus,
  activateCDK,
  getAiQuota,
  useAiQuota
};
