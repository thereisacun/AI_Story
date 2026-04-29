// modules/member/index.js
// 禁止在此文件写任何业务逻辑

const { checkMemberStatus, activateCDK, getAiQuota, useAiQuota } = require('./api.js');
const { MEMBER_TYPE, MEMBER_BENEFITS } = require('./model.js');
const { MemberService } = require('./service.js');

module.exports = {
  checkMemberStatus,
  activateCDK,
  getAiQuota,
  useAiQuota,
  MEMBER_TYPE,
  MEMBER_BENEFITS,
  MemberService
};
