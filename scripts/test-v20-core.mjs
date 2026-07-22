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
  window,
  globalThis: null,
  navigator: { share: null, storage: {}, vibrate: null },
  localStorage,
  console,
  Uint32Array,
  Math,
  Date,
  JSON,
  Blob,
  URL,
  CustomEvent: class CustomEvent { constructor(type) { this.type = type; } }
});
context.globalThis = context;
for (const file of [
  'packages/platform-core/index.js',
  'packages/tarot-core/index.js',
  'packages/reading-schema/index.js',
  'data/major-arcana.js',
  'data/minor-arcana.js'
]) vm.runInContext(read(file), context, { filename: file });

assert.equal(window.LifeMirrorPlatform.runtime, 'web');
window.LifeMirrorPlatform.storage.setSync('test', 'ok');
assert.equal(window.LifeMirrorPlatform.storage.getSync('test'), 'ok');

const cards = window.LIFE_MIRROR_DATA.cards;
assert.equal(cards.length, 78);
assert.equal(window.LifeMirrorTarotCore.validateDeck(cards).valid, true);
const numbers = window.LifeMirrorTarotCore.chooseUniqueNumbers(78, 10);
assert.equal(numbers.length, 10);
assert.equal(new Set(numbers).size, 10);
const drawn = window.LifeMirrorTarotCore.drawByNumbers(cards, [1, 39, 78], ['upright', 'reversed', 'upright']);
assert.deepEqual(drawn.map(item => item.deckNumber), [1, 39, 78]);
assert.deepEqual(drawn.map(item => item.orientation), ['upright', 'reversed', 'upright']);

const note = window.LifeMirrorReadingSchema.normalizeLearningNote({ cardId: 0, keywords: '开始、开放', upright: '向前', reversed: '冲动' });
assert.equal(note.cardId, 0);
assert.equal(note.keywords, '开始、开放');

vm.runInContext(read('js/storage.js'), context, { filename: 'js/storage.js' });
const saved = window.LifeMirrorStorage.save({
  topicKey: 'growth', topic: '个人成长', question: '测试跨平台记录', spread: 'single',
  cards: [{ id: 0, name: '愚者', orientation: 'upright', position: '此刻需要看见', deckNumber: 1 }]
});
assert.equal(saved.schemaVersion, 2);
assert.equal(saved.platform, 'web');
assert.equal(window.LifeMirrorStorage.load().length, 1);
assert.equal(window.LifeMirrorStorage.load()[0].question, '测试跨平台记录');

const preview = read('online-preview-v20.html');
assert.equal(preview.includes('./assets/cards/'), false);
assert.equal(preview.includes('src="./js/'), false);
assert.equal(preview.includes('href="./css/'), false);
assert.equal(preview.includes('lifeMirrorLearningV20'), true);

console.log('✓ 平台存储适配器');
console.log('✓ 78张牌纯核心与10张不重复抽取');
console.log('✓ 跨平台记录协议与历史记录保存');
console.log('✓ V20单文件预览资源全部内嵌');
