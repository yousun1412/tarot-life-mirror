# 生命之镜塔罗 V22

V22 在 V21 的完整78张牌、智能牌阵、日周月运势、学习、回顾日历与个人统计基础上，加入可扩展的多牌组系统。

## V22 新增

- 经典韦特与生命之镜牌面切换
- 统一 `LifeMirrorDecks` / DeckManager 接口
- 生命之镜22张大阿尔卡那上传目录
- 缺失图片自动回退到经典韦特
- 历史记录保存 `deckId`、`deckVersion` 与 `resolvedDeckId`
- 分享图、牌库、牌面查看器和学习模式同步当前牌组
- 预留卡通、写实、极简线描牌组接口
- 牌面图片按需缓存，不在PWA安装阶段预缓存整套高清图

## 放入22张生命之镜大阿尔卡那

将PNG图片复制到：

```text
assets/decks/life-mirror/major/
```

文件名必须与 `assets/decks/life-mirror/major/EXPECTED_FILES.txt` 完全一致。

无需修改 JavaScript、牌义数据或牌阵代码。应用打开“牌面风格”后会自动检测图片；缺少的牌继续使用经典韦特牌面。

完整操作见：[UPLOAD-LIFE-MIRROR-MAJOR.md](./UPLOAD-LIFE-MIRROR-MAJOR.md)

## 本地检查

```bash
node scripts/validate-build.mjs
node scripts/test-v22-core.mjs
```

当生命之镜图片尚未上传时，校验会显示 `0/22`，这是允许的。上传部分图片时会验证文件名、PNG格式、分辨率和2:3比例。

## 目录

```text
assets/decks/
├── classic-rws/
│   ├── major/          # 22张经典大牌 WebP
│   ├── minor/          # 56张经典小牌 WebP
│   └── deck.json
└── life-mirror/
    ├── major/          # 在此上传22张PNG
    ├── minor/          # 为未来56张小牌预留
    └── deck.json

data/decks-v22.js       # 牌组注册表
packages/deck-core/      # 牌组选择、检测与回退核心
js/decks.js              # 牌组选择界面
```

## 隐私

问题、历史记录、周期回顾、学习笔记和牌组选择均保存在当前设备。应用不要求注册，也不调用在线大模型。
