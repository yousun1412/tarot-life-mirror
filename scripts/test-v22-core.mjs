import fs from 'node:fs';
import vm from 'node:vm';

const read = file => fs.readFileSync(file,'utf8');
const memory = new Map();
const events = [];
const context = vm.createContext({
  window: {}, console, Map, Set, Promise, Math, Date, Object, Array, String, Number, Boolean,
  setTimeout: fn => fn(),
  CustomEvent: class { constructor(type, options={}) { this.type=type; this.detail=options.detail; } },
  document: { documentElement: { dataset: {} } },
  fetch: async url => ({ ok: String(url).includes('00-the-fool.png') || String(url).includes('01-the-magician.png'), status: 200 }),
  Image: class {},
  location: { href: 'https://example.test/' }
});
context.window.dispatchEvent = event => events.push(event);
context.window.LifeMirrorPlatform = { runtime:'web', storage:{ getSync:key=>memory.get(key)||'', setSync:(key,value)=>memory.set(key,value) } };
vm.runInContext(read('data/major-arcana.js'), context);
vm.runInContext(read('data/minor-arcana.js'), context);
vm.runInContext(read('data/decks-v22.js'), context);
vm.runInContext(read('packages/deck-core/index.js'), context);

const api = context.window.LifeMirrorDecks;
const cards = context.window.LIFE_MIRROR_DATA.cards;
const fool = cards[0], magician = cards[1], swordsAce = cards[22];
if (api.currentId !== 'classic-rws') throw new Error('默认牌组应为classic-rws');
if (!api.getCardImage(fool).endsWith('/classic-rws/major/00.webp')) throw new Error('经典大牌路径错误');
if (!api.getCardImage(swordsAce).endsWith('/classic-rws/minor/s01.webp')) throw new Error('经典小牌路径错误');
if (api.getResolvedDeckId(fool,'life-mirror') !== 'classic-rws') throw new Error('未检测时应回退经典牌面');

const status = await api.probeDeck('life-mirror',{force:true});
if (status.major !== 2 || status.minor !== 0) throw new Error(`检测数量错误：${status.major}/${status.minor}`);
if (api.getResolvedDeckId(fool,'life-mirror') !== 'life-mirror') throw new Error('已安装愚者应使用生命之镜');
if (api.getResolvedDeckId(cards[2],'life-mirror') !== 'classic-rws') throw new Error('缺失大牌应回退经典');
if (api.getResolvedDeckId(swordsAce,'life-mirror') !== 'classic-rws') throw new Error('生命之镜小牌应回退经典');
await api.setCurrentDeck('life-mirror');
if (api.currentId !== 'life-mirror' || memory.get('lifeMirrorTarotDeckV22') !== 'life-mirror') throw new Error('牌组选择未持久化');
const resolved = api.resolveRawCard({id:2,deckId:'life-mirror'},'life-mirror');
if (resolved.resolvedDeckId !== 'classic-rws') throw new Error('历史记录回退解析错误');
if (!events.some(event=>event.type==='life-mirror-deck-change')) throw new Error('未派发牌组变化事件');

console.log('✓ 默认经典牌组与78张路径');
console.log('✓ 生命之镜按文件检测');
console.log('✓ 缺失大牌和小牌自动回退');
console.log('✓ 牌组选择本地持久化');
console.log('✓ 历史牌组解析与事件接口');
