# 生命之镜塔罗 V18

完整78张 Rider–Waite–Smith 塔罗 PWA。支持问事抽牌、本日运势、本周运势、本月运势、自选数字、交给命运、正逆位、本地记录、分享卡与离线使用。

## V18 新增

- 首页六个清晰入口：本日、本周、本月、问一件事、学习塔罗、我的记录。
- 本月运势五张简洁牌阵与七张完整牌阵。
- 同一月优先回看第一次结果，确认后可覆盖重抽。
- 解读分为“30秒看懂、完整解读、深入探索”。
- 本月记录筛选、分享卡和PWA快捷入口。

## 本地运行

```bash
python -m http.server 8000
```

打开 `http://localhost:8000/`。Service Worker 需要 HTTPS 或 localhost，不能通过 `file://` 完整测试。

## 自动校验

```bash
node scripts/validate-build.mjs
```

推送到 `main` 后，GitHub Actions 会先校验再部署 GitHub Pages。
