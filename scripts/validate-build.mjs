import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const ok = message => console.log(`✓ ${message}`);
const fail = message => errors.push(message);
const clean = relative => relative.replace(/^\.\//, '');
const exists = relative => fs.existsSync(path.join(root, clean(relative)));
const read = relative => fs.readFileSync(path.join(root, clean(relative)), 'utf8');

const required = [
  'index.html','offline.html','manifest.webmanifest','version.json','service-worker.js',
  'css/main.css','css/v14.css','css/v15.css','css/v16.css','css/v17.css','css/v18.css','css/v19.css','css/v20.css','css/v21.css','css/v22.css',
  'packages/platform-core/index.js','packages/tarot-core/index.js','packages/reading-schema/index.js','packages/analytics-core/index.js','packages/deck-core/index.js',
  'data/major-arcana.js','data/minor-arcana.js','data/decks-v22.js','data/interpretation-v19.js',
  'js/app.js','js/pwa.js','js/storage.js','js/card-viewer.js','js/library.js','js/learning.js','js/share.js','js/history.js','js/insights.js','js/decks.js',
  'assets/decks/classic-rws/deck.json','assets/decks/life-mirror/deck.json',
  'assets/decks/life-mirror/major/EXPECTED_FILES.txt',
  'icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'
];
required.forEach(file => { if (!exists(file)) fail(`缺少文件：${file}`); });
if (!errors.length) ok('V22核心目录和文件齐全');

let manifest;
try { manifest = JSON.parse(read('manifest.webmanifest')); ok('manifest.webmanifest格式正确'); }
catch (error) { fail(`manifest解析失败：${error.message}`); }
for (const icon of manifest?.icons || []) if (!exists(icon.src)) fail(`manifest图标不存在：${icon.src}`);

let cards = [];
try {
  const context = vm.createContext({ window: {}, console });
  vm.runInContext(read('data/major-arcana.js'), context);
  vm.runInContext(read('data/minor-arcana.js'), context);
  cards = context.window.LIFE_MIRROR_DATA.cards;
  const major = cards.filter(card => card.arcana === 'major' || card.id < 22);
  const minor = cards.filter(card => card.arcana === 'minor');
  if (cards.length !== 78) fail(`牌数应为78，实际为${cards.length}`);
  if (major.length !== 22) fail(`大阿尔卡那应为22，实际为${major.length}`);
  if (minor.length !== 56) fail(`小阿尔卡那应为56，实际为${minor.length}`);
  if (new Set(cards.map(card => card.id)).size !== 78) fail('牌ID存在重复');
  for (const suit of ['s','w','c','p']) if (minor.filter(card => card.suit === suit).length !== 14) fail(`花色${suit}数量错误`);
  for (const card of cards) {
    if (!card.name || !card.uprightCore || !card.reversedCore) fail(`牌义字段不完整：${card.name || card.id}`);
    if (!card.classicImage || !exists(card.classicImage)) fail(`经典牌面不存在：${card.name} → ${card.classicImage}`);
  }
  ok('78张牌义与经典牌面路径检查通过');
} catch (error) { fail(`牌库执行失败：${error.stack || error.message}`); }

const classicMajor = fs.readdirSync(path.join(root,'assets/decks/classic-rws/major')).filter(name => /^\d{2}\.webp$/.test(name));
const classicMinor = fs.readdirSync(path.join(root,'assets/decks/classic-rws/minor')).filter(name => /^[cswp]\d{2}\.webp$/.test(name));
if (classicMajor.length !== 22) fail(`经典大阿尔卡那应为22张，实际${classicMajor.length}`);
if (classicMinor.length !== 56) fail(`经典小阿尔卡那应为56张，实际${classicMinor.length}`);
for (const name of [...classicMajor.map(name=>`major/${name}`),...classicMinor.map(name=>`minor/${name}`)]) {
  if (fs.statSync(path.join(root,'assets/decks/classic-rws',name)).size < 2500) fail(`经典牌图文件异常：${name}`);
}
ok('经典韦特78张独立牌图检查通过');

const expected = read('assets/decks/life-mirror/major/EXPECTED_FILES.txt').trim().split(/\r?\n/).filter(Boolean);
if (expected.length !== 22 || new Set(expected).size !== 22) fail('生命之镜大牌文件清单应为22个唯一文件名');
const lifeDir = path.join(root,'assets/decks/life-mirror/major');
const uploaded = fs.readdirSync(lifeDir).filter(name => name.toLowerCase().endsWith('.png'));
for (const name of uploaded) if (!expected.includes(name)) fail(`生命之镜出现非标准文件名：${name}`);
for (const name of uploaded) {
  const buffer = fs.readFileSync(path.join(lifeDir,name));
  if (buffer.length < 24 || buffer.toString('hex',0,8) !== '89504e470d0a1a0a') { fail(`不是有效PNG：${name}`); continue; }
  const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20);
  const ratio = width / height;
  if (Math.abs(ratio - 2/3) > 0.025) fail(`${name}比例不是2:3：${width}×${height}`);
  if (width < 900 || height < 1350) fail(`${name}分辨率偏低：${width}×${height}`);
}
ok(`生命之镜上传区检查通过：当前 ${uploaded.length}/22 张PNG`);

const html = read('index.html');
for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
  const ref = match[1];
  if (/^(?:https?:|data:|#|mailto:|javascript:)/.test(ref)) continue;
  const local = ref.split(/[?#]/)[0];
  if (local && !exists(local)) fail(`index.html引用不存在：${ref}`);
}
for (const marker of ['deckDialog','牌面风格','生命之镜','V22','data/decks-v22.js','packages/deck-core/index.js']) if (!html.includes(marker)) fail(`V22页面缺少：${marker}`);
ok('index.html牌组界面与本地资源引用检查完成');

const sw = read('service-worker.js');
const shellBlock = sw.match(/const CORE_SHELL = \[([\s\S]*?)\]\.map\(asset\)/)?.[1] || '';
for (const match of shellBlock.matchAll(/["'](\.\/[^"']+)["']/g)) {
  const ref = match[1];
  if (ref !== './' && !exists(ref)) fail(`Service Worker核心文件不存在：${ref}`);
}
if (shellBlock.includes('assets/decks/classic-rws/major') || shellBlock.includes('assets/decks/life-mirror/major')) fail('不应在安装阶段预缓存整套牌面');
if (!sw.includes("'/assets/decks/'")) fail('Service Worker未接入牌组图片运行时缓存');
ok('Service Worker按需缓存策略检查通过');

try {
  const version = JSON.parse(read('version.json')).version;
  const swVersion = sw.match(/const VERSION = ['"]([^'"]+)/)?.[1];
  const pwaVersion = read('js/pwa.js').match(/const APP_VERSION = ['"]([^'"]+)/)?.[1];
  if (version !== '22.0.0' || version !== swVersion || version !== pwaVersion) fail(`版本不一致：${version}/${swVersion}/${pwaVersion}`);
  else ok(`版本号一致：${version}`);
} catch (error) { fail(`版本检查失败：${error.message}`); }

const jsFiles = [];
function collect(dir) {
  for (const item of fs.readdirSync(path.join(root,dir),{withFileTypes:true})) {
    const rel=path.join(dir,item.name);
    if (item.isDirectory()) collect(rel); else if (item.name.endsWith('.js')) jsFiles.push(rel);
  }
}
for (const dir of ['js','data','packages']) collect(dir);
jsFiles.push('service-worker.js');
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) fail(`JavaScript语法错误：${file}\n${result.stderr}`);
}
ok('全部JavaScript语法检查完成');

if (!read('packages/reading-schema/index.js').includes('const VERSION = 4')) fail('阅读记录协议未升级到schemaVersion 4');
for (const marker of ['getCardImage','getResolvedDeckId','probeDeck','setCurrentDeck','fallbackDeck','loadCardImage']) if (!read('packages/deck-core/index.js').includes(marker)) fail(`DeckManager缺少：${marker}`);
for (const marker of ['deckId','resolvedDeckId','deckVersion']) if (!read('js/storage.js').includes(marker) || !read('js/app.js').includes(marker)) fail(`记录牌组字段未完整接入：${marker}`);
for (const marker of ['cartoon','realistic','line-art']) if (!read('data/decks-v22.js').includes(marker)) fail(`未来牌组接口缺少：${marker}`);
ok('多牌组、回退和记录协议结构检查通过');

if (errors.length) {
  console.error('\n构建校验失败：');
  errors.forEach(error => console.error(`✗ ${error}`));
  process.exit(1);
}
console.log(`\nV22构建校验通过：78张经典牌面，生命之镜上传区 ${uploaded.length}/22 张。`);
