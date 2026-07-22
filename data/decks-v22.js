/* V22 多牌组注册表。新增牌面风格时只需注册配置并放入对应图片。 */
(() => {
  const majorFiles = [
    '00-the-fool.png','01-the-magician.png','02-the-high-priestess.png','03-the-empress.png',
    '04-the-emperor.png','05-the-hierophant.png','06-the-lovers.png','07-the-chariot.png',
    '08-strength.png','09-the-hermit.png','10-wheel-of-fortune.png','11-justice.png',
    '12-the-hanged-man.png','13-death.png','14-temperance.png','15-the-devil.png',
    '16-the-tower.png','17-the-star.png','18-the-moon.png','19-the-sun.png',
    '20-judgement.png','21-the-world.png'
  ];

  window.LIFE_MIRROR_DECKS = Object.freeze({
    'classic-rws': {
      id: 'classic-rws',
      name: '经典韦特',
      englishName: 'Classic RWS',
      description: '完整78张传统 Rider–Waite–Smith 牌面，适合学习传统象征。',
      version: '1.0.0',
      author: 'Rider–Waite–Smith',
      status: 'ready',
      builtIn: true,
      fallbackDeck: null,
      formats: { major: 'webp', minor: 'webp' },
      coverage: { major: 22, minor: 56 },
      paths: {
        major: './assets/decks/classic-rws/major/{id2}.webp',
        minor: './assets/decks/classic-rws/minor/{code}.webp'
      },
      accent: 'classic',
      tags: ['传统', '完整78张', '适合学习']
    },
    'life-mirror': {
      id: 'life-mirror',
      name: '生命之镜',
      englishName: 'Mirror of Life',
      description: '深靛蓝、暗紫与古金色的雕版艺术牌组。当前等待放入22张重绘大阿尔卡那。',
      version: '1.0.0',
      author: '生命之镜塔罗',
      status: 'installable',
      builtIn: false,
      fallbackDeck: 'classic-rws',
      formats: { major: 'png', minor: 'png' },
      coverage: { major: 22, minor: 0 },
      paths: {
        major: './assets/decks/life-mirror/major/{filename}',
        minor: './assets/decks/life-mirror/minor/{code}.png'
      },
      majorFiles,
      accent: 'life-mirror',
      tags: ['原创艺术', '大牌22张', '小牌自动回退']
    },
    'cartoon': {
      id: 'cartoon', name: '轻绘卡通', englishName: 'Soft Cartoon',
      description: '面向新手与轻松体验的亲和卡通牌面。', version: '0.0.0',
      status: 'planned', builtIn: false, fallbackDeck: 'classic-rws',
      coverage: { major: 0, minor: 0 }, accent: 'cartoon', tags: ['未来牌组', '亲和', '新手']
    },
    'realistic': {
      id: 'realistic', name: '叙事写实', englishName: 'Narrative Realism',
      description: '具有真实人物、环境与电影叙事感的牌面。', version: '0.0.0',
      status: 'planned', builtIn: false, fallbackDeck: 'classic-rws',
      coverage: { major: 0, minor: 0 }, accent: 'realistic', tags: ['未来牌组', '写实', '沉浸']
    },
    'line-art': {
      id: 'line-art', name: '极简线描', englishName: 'Minimal Line Art',
      description: '黑白线条、传统构图与低流量体验。', version: '0.0.0',
      status: 'planned', builtIn: false, fallbackDeck: 'classic-rws',
      coverage: { major: 0, minor: 0 }, accent: 'line-art', tags: ['未来牌组', '线条', '低流量']
    }
  });
})();
