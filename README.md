# 生命之镜塔罗 V15

无需注册、不调用大模型、可安装并离线使用的完整78张塔罗应用。

## V15重点

- 完整78张 Rider–Waite–Smith 牌面。
- 洗牌后可选择“自己选择数字”或“交给命运”。
- 自选模式：输入1–78；三牌编号不可重复。
- 命运模式：程序从已经洗好的牌堆中随机抽取，不根据问题改变牌面。
- 正位、逆位、本地规则牌义和组合分析。
- 本地历史、牌库、分享卡和牌面放大。
- PWA安装、离线使用和可靠更新提示。
- GitHub Actions自动检查78张数据、图片路径、HTML引用和Service Worker核心文件。

## 本地预览

```bash
python -m http.server 8080
```

打开 `http://localhost:8080/`。

## GitHub Pages自动部署

仓库包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 后会：

1. 校验78张牌和56张本地小阿尔卡那牌图；
2. 检查HTML、清单、脚本和Service Worker引用；
3. 校验通过后自动发布GitHub Pages。

首次使用工作流时，在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。


## V15 解读引擎 2.0

- 78 张牌分别生成 5 个问题类型 × 正逆位的本地解释，共 780 个可验证解释入口
- 牌阵位置不再只使用统一模板，现状、盲点、行动、阻力、资源和趋势分别处理
- 三牌加入数字序列、相同数字、花色互动、宫廷牌和大小阿尔卡那主次分析
- 解读页新增“牌与牌之间如何发展”
