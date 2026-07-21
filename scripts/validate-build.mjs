import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const ok = message => console.log(`✓ ${message}`);
const fail = message => errors.push(message);
const exists = relative => fs.existsSync(path.join(root, relative.replace(/^\.\//, '')));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const required = [
  'index.html', 'offline.html', 'manifest.webmanifest', 'version.json', 'service-worker.js',
  'css/main.css', 'css/v14.css', 'css/v15.css', 'css/v16.css', 'css/v17.css', 'css/v18.css', 'data/major-arcana.js', 'data/minor-arcana.js', 'data/interpretation-v18.js',
  'js/app.js', 'js/pwa.js', 'js/storage.js', 'js/card-viewer.js', 'js/library.js',
  'js/share.js', 'js/history.js', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];
required.forEach(file => { if (!exists(file)) fail(`缺少文件：${file}`); });
if (!errors.length) ok('核心目录和文件齐全');

try {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  for (const icon of manifest.icons || []) {
    if (!exists(icon.src)) fail(`manifest图标不存在：${icon.src}`);
  }
  ok('manifest.webmanifest格式正确');
} catch (error) {
  fail(`manifest解析失败：${error.message}`);
}

let cards = [];
try {
  const context = vm.createContext({ window: {}, console });
  vm.runInContext(read('data/major-arcana.js'), context, { filename: 'major-arcana.js' });
  vm.runInContext(read('data/minor-arcana.js'), context, { filename: 'minor-arcana.js' });
  cards = context.window.LIFE_MIRROR_DATA.cards;
  const major = cards.filter(card => card.arcana === 'major' || card.id < 22);
  const minor = cards.filter(card => card.arcana === 'minor');
  if (cards.length !== 78) fail(`牌数应为78，实际为${cards.length}`);
  if (major.length !== 22) fail(`大阿尔卡那应为22，实际为${major.length}`);
  if (minor.length !== 56) fail(`小阿尔卡那应为56，实际为${minor.length}`);
  const ids = new Set(cards.map(card => card.id));
  if (ids.size !== cards.length) fail('牌ID存在重复');
  for (const suit of ['s', 'w', 'c', 'p']) {
    const count = minor.filter(card => card.suit === suit).length;
    if (count !== 14) fail(`花色${suit}应为14张，实际为${count}`);
  }
  for (const card of cards) {
    if (!card.name || !card.uprightCore || !card.reversedCore) fail(`牌义字段不完整：${card.name || card.id}`);
    if (card.image?.startsWith('./') && !exists(card.image)) fail(`牌图不存在：${card.name} → ${card.image}`);
  }
  ok('78张牌、正逆位数据和四种花色检查通过');
} catch (error) {
  fail(`牌库脚本执行失败：${error.stack || error.message}`);
}

const cardImages = fs.readdirSync(path.join(root, 'assets/cards')).filter(name => name.endsWith('.webp'));
if (cardImages.length !== 56) fail(`assets/cards应有56张WebP，实际为${cardImages.length}`);
for (const name of cardImages) {
  const size = fs.statSync(path.join(root, 'assets/cards', name)).size;
  if (size < 3000) fail(`牌图文件异常小：assets/cards/${name}`);
}
ok('56张小阿尔卡那本地牌图检查完成');

const html = read('index.html');
const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match => match[1]);
for (const ref of refs) {
  if (/^(?:https?:|data:|#|mailto:|javascript:)/.test(ref)) continue;
  const clean = ref.split(/[?#]/)[0];
  if (clean && !exists(clean)) fail(`index.html引用不存在：${ref}`);
}
ok('index.html本地引用检查完成');

const sw = read('service-worker.js');
const shellBlock = sw.match(/const CORE_SHELL = \[([\s\S]*?)\]\.map\(asset\)/)?.[1] || '';
const shellRefs = [...shellBlock.matchAll(/["'](\.\/[^"']+)["']/g)].map(match => match[1]);
for (const ref of shellRefs) {
  if (ref === './') continue;
  if (!exists(ref)) fail(`Service Worker核心文件不存在：${ref}`);
}
if (shellRefs.some(ref => ref.includes('assets/cards'))) fail('V17不应在安装阶段预缓存全部牌图');
ok('Service Worker核心缓存清单检查完成');

try {
  const version = JSON.parse(read('version.json')).version;
  const swVersion = sw.match(/const VERSION = ['"]([^'"]+)/)?.[1];
  const pwaVersion = read('js/pwa.js').match(/const APP_VERSION = ['"]([^'"]+)/)?.[1];
  if (version !== swVersion || version !== pwaVersion) {
    fail(`版本号不一致：version.json=${version}, service-worker=${swVersion}, pwa=${pwaVersion}`);
  } else ok(`版本号一致：${version}`);
} catch (error) {
  fail(`版本一致性检查失败：${error.message}`);
}

const jsFiles = [];
for (const directory of ['js', 'data']) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (name.endsWith('.js')) jsFiles.push(path.join(directory, name));
  }
}
jsFiles.push('service-worker.js');
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) fail(`JavaScript语法错误：${file}\n${result.stderr}`);
}
ok('JavaScript语法检查完成');


// V18 additional checks
for (const relativePath of ['css/v18.css','data/interpretation-v18.js']) {
  if (!exists(relativePath)) fail(`缺少 V18 文件：${relativePath}`);
}
const v18EngineText = read('data/interpretation-v18.js');
for (const marker of ['TOPIC_GUIDES','POSITION_BUILDERS','getNarrativeLinks','daily','weekly','monthly','18.0.0','buildMultiSummary']) {
  if (!v18EngineText.includes(marker)) fail(`V18 引擎缺少标记：${marker}`);
}
try {
  const context = vm.createContext({ window: {}, console });
  vm.runInContext(read('data/major-arcana.js'), context, { filename: 'major-arcana.js' });
  vm.runInContext(read('data/minor-arcana.js'), context, { filename: 'minor-arcana.js' });
  vm.runInContext(read('data/interpretation-v18.js'), context, { filename: 'interpretation-v18.js' });
  const enriched = context.window.LIFE_MIRROR_DATA.cards;
  let topicCount = 0;
  for (const card of enriched) {
    for (const topic of ['relationship','work','growth','emotion','decision','daily','weekly','monthly']) {
      for (const orientation of ['upright','reversed']) {
        const text = context.window.LifeMirrorV18.topicText(card, topic, orientation);
        if (!text || text.length < 30) fail(`V18主题解释异常：${card.name}/${topic}/${orientation}`);
        topicCount += 1;
      }
    }
  }
  if (topicCount !== 1248) fail(`V18主题解释应为1248条，实际为${topicCount}`);
  else ok('V18 1248条正逆位主题解释检查通过');
} catch (error) {
  fail(`V18引擎执行失败：${error.stack || error.message}`);
}

const appText = read('js/app.js');
for (const marker of ['beginDailyFortune','beginWeeklyFortune','beginMonthlyFortune','monthly-five','monthly-seven','如上，如下；如内，如外。']) {
  if (!appText.includes(marker)) fail(`V18周期运势流程缺少标记：${marker}`);
}
if (!appText.includes("getPositions().length")) fail('V18抽牌数量未改为动态牌阵长度');
for (const marker of ['data-interpretation-layer="overview"','data-interpretation-layer="full"','data-interpretation-layer="deep"','本月运势']) { if (!html.includes(marker)) fail(`V18页面缺少标记：${marker}`); }

if (errors.length) {
  console.error('\n构建校验失败：');
  errors.forEach(error => console.error(`✗ ${error}`));
  process.exit(1);
}

console.log(`\nV18构建校验通过：${cards.length || 78}张牌，${cardImages.length}张本地小阿尔卡那牌图。`);
