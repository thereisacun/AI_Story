// modules/progress/model.js
// 禁止在此文件写任何执行逻辑

const ProgressModel = {
  status: {
    UNREAD: 0,
    READING: 1,
    FINISHED: 2
  }
};

module.exports = { ProgressModel };
