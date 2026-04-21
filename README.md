# AI_Story - AI短文记单词

> 帮助大学生通过「中英夹杂式语境阅读」高效记忆单词的微信小程序

## 功能特性

- 📚 **预置短文**：20篇精选短文，覆盖玄幻修仙、都市异能、历史穿越、末日逃生4个分类
- ✨ **AI生成**：输入主题，AI生成嵌入单词的故事
- 🔄 **三种模式**：中英夹杂 / 全中文 / 全英文 自由切换
- ❤️ **收藏分享**：收藏短文、分享给好友
- 💎 **会员系统**：月卡/季卡/年卡，激活码兑换

## 技术栈

- 微信原生小程序（JavaScript）
- Vant Weapp UI组件库
- 微信云开发（数据库）
- 混元大模型（AI生成）

## 项目结构

```
AI_Story/
├── app.js / app.json / app.wxss     # 全局入口
├── pages/                            # 页面层
│   ├── index/                        # 首页
│   ├── read/                         # 阅读页
│   ├── generate/                     # AI生成页
│   └── my/                           # 我的页
├── modules/                          # 业务模块层
│   ├── article/                      # 短文模块
│   ├── ai/                           # AI生成模块
│   ├── member/                       # 会员模块
│   └── progress/                     # 进度模块
├── utils/                            # 工具层
│   ├── ai.js                         # AI调用封装
│   ├── db.js                         # 数据库操作封装
│   └── storage.js                    # 本地存储封装
├── components/                       # 公共组件
├── data/                             # 静态数据
│   └── articles.json                 # 预置20篇短文
└── styles/                           # 样式
```

## 开发规范

本项目遵循 SDD（Spec-Driven Development）规范，详见 [规范文档](./raw/specs/ai-word/)

## License

MIT