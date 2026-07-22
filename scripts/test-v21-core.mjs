import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
const memory = new Map();
const localStorage = {
  getItem: key => memory.has(key) ? memory.get(key) : null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: key => memory.delete(key)
};
const window = { dispatchEvent() {}, LIFE_MIRROR_DATA: { cards: [] } };
const context = vm.createContext({
  window, globalThis: null,
  navigator: { share: null, storage: {}, vibrate: null }, localStorage, console,
  Uint32Array, Math, Date, Intl, JSON, Blob, URL, Map, Set,
  CustomEvent: class CustomEvent { constructor(type) { this.type = type; } }
});
context.globalThis = context;
for (const file of [
  'packages/platform-core/index.js','packages/tarot-core/index.js','packages/reading-schema/index.js','packages/analytics-core/index.js',
  'data/major-arcana.js','data/minor-arcana.js'
]) vm.runInContext(read(file), context, { filename: file });

assert.equal(window.LifeMirrorPlatform.runtime, 'web');
assert.equal(window.LifeMirrorTarotCore.validateDeck(window.LIFE_MIRROR_DATA.cards).valid, true);
assert.equal(window.LifeMirrorReadingSchema.version, 3);
const normalizedReview = window.LifeMirrorReadingSchema.normalizeReview({ actual: '发生了变化', rating: 8 });
assert.equal(normalizedReview.rating, 5);

vm.runInContext(read('js/storage.js'), context, { filename: 'js/storage.js' });
const now = Date.now();
const daily = window.LifeMirrorStorage.save({
  id:'daily-test',timestamp:now,readingType:'daily',dayKey:'2026-07-22',topic:'本日运势',question:'今天的主题',spread:'daily-single',
  cards:[{id:0,name:'愚者',orientation:'upright',position:'今日主题',deckNumber:1}],review:{actual:'开始了新任务',matched:'开放',rating:5,updatedAt:'2026-07-22T10:00:00Z'}
});
window.LifeMirrorStorage.save({
  id:'reflection-test',timestamp:now-86400000,readingType:'reflection',topic:'个人成长',question:'如何前进',spread:'three',favorite:true,
  cards:[{id:0,name:'愚者',orientation:'upright'},{id:22,name:'宝剑王牌',orientation:'reversed'}]
});
assert.equal(daily.schemaVersion, 3);
assert.equal(window.LifeMirrorStorage.load().length, 2);
assert.equal(window.LifeMirrorStorage.load().find(item=>item.id==='daily-test').review.rating, 5);

const stats = window.LifeMirrorAnalytics.summarize(window.LifeMirrorStorage.load(), window.LIFE_MIRROR_DATA.cards, now);
assert.equal(stats.totalReadings, 2);
assert.equal(stats.totalCards, 3);
assert.equal(stats.reviewed, 1);
assert.equal(stats.favorites, 1);
assert.equal(stats.cards[0].key, '愚者');
assert.equal(stats.cards[0].count, 2);
assert.equal(Object.keys(stats.calendar).length, 2);

const preview = read('online-preview-v21.html');
assert.equal(preview.includes('./assets/cards/'), false);
assert.equal(preview.includes('src="./js/'), false);
assert.equal(preview.includes('href="./css/'), false);
assert.equal(preview.includes('记录与洞察'), true);
assert.equal(preview.includes('LifeMirrorAnalytics'), true);

console.log('✓ 阅读记录协议V3与旧字段兼容');
console.log('✓ 周期回顾保存与评分限制');
console.log('✓ 日历映射和牌频、花色、正逆位统计');
console.log('✓ V21单文件预览资源全部内嵌');
