# 平台适配器

V21 延续并扩展平台能力统一到 `window.LifeMirrorPlatform`。当前 Web 版默认使用 localStorage、Web Share 和 Service Worker。

后续平台只需注册同名适配器，不修改塔罗核心与牌义数据：

- `capacitor.example.js`：Android / iOS
- `tauri.example.js`：Windows / macOS / Linux
- `wechat.example.js`：微信小程序

这些文件是接口示例，不会被 Web 页面加载。
