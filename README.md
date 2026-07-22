# 生命之镜塔罗 V21

完整78张 Rider–Waite–Smith 塔罗 PWA。V21 在智能牌阵、日周月运势和学习系统基础上，加入记录日历、周期回顾和个人统计。

## 主要功能

- 78张牌、正逆位、自选数字和“交给命运”
- 单牌、三牌、关系、选择、阻力资源、凯尔特十字
- 本日、本周、本月运势
- 三层解读、分享图片和本地历史记录
- 每日学习、看图识牌、个人牌义
- 记录日历、日/周/月回顾、个人统计
- PWA安装、离线使用和自动更新
- 跨平台核心，为 Capacitor、Tauri 和微信小程序预留接口

## 本地运行

```bash
python -m http.server 8080
```

打开 `http://localhost:8080`。Service Worker 需要 HTTPS 或 localhost。

## 自动检查

```bash
node scripts/validate-build.mjs
node scripts/test-v21-core.mjs
```

## 发布

仓库已包含 GitHub Actions。推送到 `main` 后，自动检查通过才会部署 GitHub Pages。
