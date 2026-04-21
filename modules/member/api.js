// modules/member/api.js
// 禁止在此文件写任何业务逻辑

import { MemberService } from './service.js';

export async function checkMemberStatus(openid) {
  return await MemberService.getStatus(openid);
}

export async function activateCDK(cdk, openid) {
  return await MemberService.activate(cdk, openid);
}

export async function getAiQuota(openid) {
  return await MemberService.getQuota(openid);
}

export async function useAiQuota(openid) {
  return await MemberService.consumeQuota(openid);
}