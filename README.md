# 生命之镜塔罗 V20

V20 在 V19 全部抽牌与运势功能之上，加入跨平台核心架构和学习塔罗基础版。

## 新增

- `packages/tarot-core`：纯洗牌、随机、抽牌与牌库校验逻辑
- `packages/platform-core`：Web / Capacitor / Tauri / 微信小程序能力适配入口
- `packages/reading-schema`：跨平台阅读记录与个人牌义协议
- 每日学习牌
- 看图识牌测验
- 我的牌义
- 本地学习进度

## 本地运行

```bash
python -m http.server 8080
```

打开 `http://localhost:8080`。

## 发布

将全部文件上传到仓库根目录。GitHub Actions 会运行 `node scripts/validate-build.mjs`，通过后自动发布。
