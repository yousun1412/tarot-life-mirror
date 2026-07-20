# 生命之镜塔罗 V11 · PWA

这是一个无需注册、不调用大模型、可安装并离线使用的静态塔罗应用。

## 本版功能

- 内嵌22张完整大阿尔卡那牌面
- 正位与逆位，逆位翻牌后旋转180°
- 本地规则牌义与三牌组合分析
- 手机、平板和电脑自适应
- 可安装到 Android、iPhone、iPad 和电脑桌面
- 首次在线打开后自动缓存，之后可离线使用
- 历史记录仅保存在当前设备浏览器

## 本地预览

PWA 的 Service Worker 不能在 `file://` 下运行，需要用本地服务器：

```bash
python -m http.server 8080
```

然后打开：

```text
http://localhost:8080/
```

## 发布

整个目录可直接部署到 GitHub Pages、Cloudflare Pages、Netlify 或 Vercel。必须使用 HTTPS，浏览器才会开放安装与离线能力。

GitHub Pages 发布时，将本目录所有文件放在仓库根目录，并在仓库 Settings → Pages 中选择主分支根目录。
