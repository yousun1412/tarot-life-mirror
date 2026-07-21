const STEPS = ['准备', '提问', '洗牌抽牌', '观察', '解读', '反思'];

const TOPICS = {
  relationship: {
    label: '关系',
    note: '本地规则不会判断第三方真实想法，只分析关系结构、沟通、边界和你可以采取的行动。'
  },
  work: {
    label: '学习与工作',
    note: '重点观察目标、资源、责任、节奏和现实执行。'
  },
  growth: {
    label: '个人成长',
    note: '重点观察旧身份、自动反应与正在形成的新选择。'
  },
  emotion: {
    label: '情绪状态',
    note: '重点区分感受、身体反应、想象与可验证事实。'
  },
  decision: {
    label: '一个具体决定',
    note: '重点比较事实、价值、代价、风险和可以验证的下一步。'
  },
  daily: {
    label: '本日运势',
    note: '把牌面作为今天的观察提示：留意正在发生的条件，并把建议落实为一个小行动。'
  },
  weekly: {
    label: '本周运势',
    note: '把牌面作为本周的观察地图：辨认主线、挑战与可使用的资源，再安排现实行动。'
  }
};

const POSITION_RULES = {
  single: {
    label: '此刻需要看见',
    role: '核心视角',
    prompt: '这张牌集中指出当前最值得看见和核对的主题。'
  },
  current: {
    label: '当前状态',
    role: '现状',
    prompt: '这张牌描述目前最显著的状态、力量或阻力。'
  },
  awareness: {
    label: '需要看见',
    role: '盲点',
    prompt: '这张牌指出容易被忽略、却会影响判断的部分。'
  },
  action: {
    label: '可以行动',
    role: '行动',
    prompt: '这张牌用于形成一个现实、可执行的下一步。'
  },
  dailySingle: {
    label: '今日主题',
    role: '核心视角',
    prompt: '这张牌呈现今天最值得留意和使用的核心主题。'
  },
  dailyFlow: {
    label: '今日主线',
    role: '趋势',
    prompt: '这张牌描述今天较可能贯穿始终的主线与发展方向。'
  },
  dailyWatch: {
    label: '今日需要留意',
    role: '盲点',
    prompt: '这张牌提醒今天容易被忽略、放大或使用失衡的部分。'
  },
  dailyAction: {
    label: '今日行动建议',
    role: '行动',
    prompt: '这张牌帮助你把今天的提示转化为一个具体行动。'
  },
  weeklyFlow: {
    label: '本周整体主线',
    role: '趋势',
    prompt: '这张牌呈现本周较可能贯穿始终的主要能量与发展方向。'
  },
  weeklyChallenge: {
    label: '本周主要挑战',
    role: '阻力',
    prompt: '这张牌指出本周最需要正视、调整或避免放大的困难。'
  },
  weeklyResource: {
    label: '本周可用力量',
    role: '资源',
    prompt: '这张牌指出本周已经存在、可以主动调用的资源与能力。'
  },
  weeklyOverall: {
    label: '本周整体能量',
    role: '趋势',
    prompt: '这张牌概括本周的核心氛围和可能持续出现的主题。'
  },
  weeklyWork: {
    label: '学习与工作',
    role: '现状',
    prompt: '这张牌描述本周在学习、工作、目标与责任方面的主要状态。'
  },
  weeklyRelationship: {
    label: '关系与互动',
    role: '现状',
    prompt: '这张牌用于观察本周关系中的互动、沟通与边界，不推断他人未表达的内心。'
  },
  weeklyEmotion: {
    label: '情绪与内在',
    role: '核心视角',
    prompt: '这张牌呈现本周内在感受、身体反应与心理节奏的核心主题。'
  },
  weeklyReality: {
    label: '现实资源',
    role: '资源',
    prompt: '这张牌指出本周可用的时间、金钱、身体条件或现实支持。'
  },
  weeklyFullChallenge: {
    label: '主要挑战',
    role: '阻力',
    prompt: '这张牌指出本周最需要管理的阻力、风险或失衡模式。'
  },
  weeklyAdvice: {
    label: '本周建议',
    role: '行动',
    prompt: '这张牌帮助你把本周的整体提示转化为具体、可执行的安排。'
  }
};

const state = {
  step: 0,
  topic: '',
  question: '',
  spread: 'single',
  shuffleCount: 0,
  shuffled: false,
  selected: [],
  observation: null,
  reflection: '',
  nextAction: '',
  shuffledDeck: [],
  chosenNumbers: [],
  drawMode: '',
  readingType: 'reflection',
  dayKey: '',
  weekKey: '',
  periodLabel: '',
  recordId: ''
};

const $ = id => document.getElementById(id);
const message = $('message');
const choices = $('choices');
const actions = $('actions');
const inputWrap = $('inputWrap');
const deck = $('deckWrap');
const hands = $('hands');
const toast = $('toast');
const sparkle = $('sparkle');
const panel = $('interpretation');

function safe(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderProgress() {
  $('progress').innerHTML = STEPS.map((_, index) =>
    `<span class="progress-step ${index < state.step ? 'done' : index === state.step ? 'active' : ''}"></span>`
  ).join('') + `<span class="progress-label">${STEPS[Math.min(state.step, 5)]}</span>`;
  $('stageName').textContent = STEPS[Math.min(state.step, 5)];
}

function setDialogue(text, options = []) {
  document.querySelectorAll('.draw-method-note').forEach(node => node.remove());
  message.textContent = text;
  choices.innerHTML = '';
  actions.innerHTML = '';
  inputWrap.hidden = true;
  inputWrap.innerHTML = '';

  options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'choice';
    button.textContent = option.label;
    button.onclick = option.onClick;
    choices.appendChild(button);
  });
}

function primary(label, handler) {
  const button = document.createElement('button');
  button.className = 'primary';
  button.textContent = label;
  button.onclick = handler;
  actions.appendChild(button);
}

function ghost(label, handler) {
  const button = document.createElement('button');
  button.className = 'ghost';
  button.textContent = label;
  button.onclick = handler;
  actions.appendChild(button);
}

function showInput(type, placeholder, value, onSubmit) {
  inputWrap.hidden = false;
  inputWrap.innerHTML = type === 'textarea'
    ? `<textarea class="textarea" id="dialogueInput" placeholder="${safe(placeholder)}">${safe(value || '')}</textarea>`
    : `<input class="input" id="dialogueInput" maxlength="240" placeholder="${safe(placeholder)}" value="${safe(value || '')}">`;

  primary('继续', () => {
    const current = $('dialogueInput').value.trim();
    if (!current) {
      showToast('先写一点内容吧');
      return;
    }
    onSubmit(current);
  });
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1600);
}

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


function getLocalWeekInfo(date = new Date()) {
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const weekday = current.getDay() || 7;
  const monday = new Date(current);
  monday.setDate(current.getDate() - weekday + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const key = localDayKey(monday);
  const format = value => `${value.getMonth() + 1}月${value.getDate()}日`;
  return { key, monday, sunday, label: `${format(monday)}—${format(sunday)}` };
}

function isSingleSpread() {
  return state.spread === 'single' || state.spread === 'daily-single';
}

function requiredCardCount() {
  return getPositions().length;
}

function isDailyReading() {
  return state.readingType === 'daily';
}


function isWeeklyReading() {
  return state.readingType === 'weekly';
}

function isPeriodicReading() {
  return isDailyReading() || isWeeklyReading();
}

function getTodayReading() {
  const key = localDayKey();
  return window.LifeMirrorStorage?.load().find(record => record.readingType === 'daily' && record.dayKey === key) || null;
}

function getThisWeekReading() {
  const { key } = getLocalWeekInfo();
  return window.LifeMirrorStorage?.load().find(record => record.readingType === 'weekly' && record.weekKey === key) || null;
}

function getPositions() {
  if (state.spread === 'daily-single') return [POSITION_RULES.dailySingle];
  if (state.spread === 'daily-three') return [POSITION_RULES.dailyFlow, POSITION_RULES.dailyWatch, POSITION_RULES.dailyAction];
  if (state.spread === 'weekly-three') return [POSITION_RULES.weeklyFlow, POSITION_RULES.weeklyChallenge, POSITION_RULES.weeklyResource];
  if (state.spread === 'weekly-seven') return [
    POSITION_RULES.weeklyOverall,
    POSITION_RULES.weeklyWork,
    POSITION_RULES.weeklyRelationship,
    POSITION_RULES.weeklyEmotion,
    POSITION_RULES.weeklyReality,
    POSITION_RULES.weeklyFullChallenge,
    POSITION_RULES.weeklyAdvice
  ];
  return state.spread === 'single'
    ? [POSITION_RULES.single]
    : [POSITION_RULES.current, POSITION_RULES.awareness, POSITION_RULES.action];
}

function getSlotLabels() {
  return getPositions().map(position => position.label);
}

function renderSlots() {
  const positions = getPositions();
  const single = positions.length === 1;
  const spread = $('spread');
  spread.classList.toggle('single-mode', single);
  spread.classList.toggle('three-mode', positions.length === 3);
  spread.classList.toggle('seven-mode', positions.length === 7);
  spread.innerHTML = positions.map((position, index) => `
    <div class="slot" data-slot="${index}">
      <span class="empty-label">${safe(position.label)}</span>
      <span class="slot-label">${safe(position.label)}</span>
    </div>`).join('');
}

function clearDeck() {
  deck.className = 'deck-wrap';
  deck.innerHTML = '<div class="deck-placeholder">牌会在这里出现</div>';
}

function createDeck() {
  deck.innerHTML = '';
  deck.className = `deck-wrap${state.shuffled ? ' ready-stack' : ''}${state.drawMode === 'fate' && state.step === 2 ? ' fate-drawing' : ''}`;
  const total = TAROT_CARDS.length;
  const remaining = Math.max(0, total - state.chosenNumbers.length);
  const count = Math.min(16, Math.max(7, Math.ceil(remaining / 6)));

  for (let index = 0; index < count; index++) {
    const card = document.createElement('div');
    const offset = index - (count - 1) / 2;
    card.className = 'deck-card';
    card.style.transform = `translate(${index * 1.15}px, ${-index * 0.75}px) rotate(${offset * 0.16}deg)`;
    card.style.zIndex = index;
    deck.appendChild(card);
  }

  const badge = document.createElement('span');
  badge.className = 'deck-count-badge';
  badge.textContent = state.shuffled ? `${remaining} / ${total}` : `${total} 张`;
  deck.appendChild(badge);

  const hint = document.createElement('div');
  hint.className = 'deck-hint';
  hint.textContent = state.shuffled
    ? state.drawMode === 'manual'
      ? `牌保持叠放 · 从 1–${total} 中选择编号`
      : state.drawMode === 'fate'
        ? '牌保持叠放 · 交给命运随机抽取'
        : '牌保持叠放 · 请选择抽牌方式'
    : '点击牌堆三次，或按空格键';
  deck.appendChild(hint);
  deck.setAttribute('aria-label', state.shuffled
    ? state.drawMode === 'manual'
      ? `已洗好的${total}张牌。请在下方输入编号抽牌。`
      : state.drawMode === 'fate'
        ? `已洗好的${total}张牌。正在随机抽取。`
        : `已洗好的${total}张牌。请选择自己选数字或交给命运。`
    : `共${total}张牌，点击三次洗牌。`);
}

function shuffleOnce() {
  if (state.step !== 2 || state.shuffled || state.shuffleCount >= 3) return;

  state.shuffleCount += 1;
  hands.className = 'hands shuffle';
  deck.classList.add('shuffling');
  showToast(`洗牌 ${state.shuffleCount}/3`);

  setTimeout(() => {
    hands.className = 'hands';
    deck.classList.remove('shuffling');
  }, 480);

  if (state.shuffleCount >= 3) {
    setTimeout(finishShuffle, 560);
  }
}

function randomInt(max) {
  if (!Number.isInteger(max) || max <= 0) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const limit = Math.floor(0x100000000 / max) * max;
    const values = new Uint32Array(1);
    do globalThis.crypto.getRandomValues(values); while (values[0] >= limit);
    return values[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function randomOrientation() {
  return randomInt(2) === 0 ? 'upright' : 'reversed';
}

function shuffledCopy(cards) {
  const result = [...cards];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function finishShuffle() {
  if (state.shuffled) return;
  state.shuffled = true;
  state.shuffledDeck = shuffledCopy(TAROT_CARDS);
  state.chosenNumbers = [];
  state.drawMode = '';
  createDeck();
  chooseDrawMethod();
}

function chooseDrawMethod() {
  const required = requiredCardCount();
  setDialogue(
    `牌已经洗好，并保持叠成一摞。
这次由你选择数字，还是交给命运随机抽取${required}张不重复的牌？`,
    [
      {
        label: '自己选择数字',
        onClick: () => {
          state.drawMode = 'manual';
          createDeck();
          promptCardNumber();
        }
      },
      {
        label: '交给命运',
        onClick: () => {
          state.drawMode = 'fate';
          createDeck();
          beginFateDraw();
        }
      }
    ]
  );
  const note = document.createElement('p');
  note.className = 'draw-method-note';
  note.textContent = '两种方式使用同一副已经洗好的牌；“交给命运”只随机选择牌堆位置，不会根据问题改变牌面。';
  choices.after(note);
}

function beginFateDraw() {
  const required = requiredCardCount();
  setDialogue(required === 1
    ? '你把这次选择交给了命运。牌堆会随机给出一张牌。'
    : `你把这次选择交给了命运。牌堆会依次随机给出${required}张不重复的牌。`);
  deck.classList.add('fate-drawing');
  setTimeout(drawNextFateCard, 650);
}

function drawNextFateCard() {
  if (!state.shuffled || state.drawMode !== 'fate' || state.step !== 2) return;
  const total = state.shuffledDeck.length;
  const available = Array.from({ length: total }, (_, index) => index + 1)
    .filter(number => !state.chosenNumbers.includes(number));
  if (!available.length) return;
  const number = available[randomInt(available.length)];
  const next = state.selected.length + 1;
  const required = requiredCardCount();
  message.textContent = required === 1
    ? '牌堆正在为你选出一张牌……'
    : `牌堆正在选出第 ${next}/${required} 张牌……`;
  drawCardByNumber(number, { fate: true });
}

function promptCardNumber() {
  const total = state.shuffledDeck.length;
  const required = requiredCardCount();
  const next = state.chosenNumbers.length + 1;
  const pickedText = state.chosenNumbers.length
    ? `
已选择：${state.chosenNumbers.join('、')}`
    : '';

  setDialogue(
    required === 1
      ? `牌已经洗好，并保持叠成一摞。
请凭第一感觉选择 1–${total} 中的一个数字。`
      : `牌已经洗好，并保持叠成一摞。
请选择第 ${next}/${required} 个数字（1–${total}），数字不能重复。${pickedText}`
  );

  inputWrap.hidden = false;
  inputWrap.innerHTML = `
    <div class="number-picker">
      <label for="cardNumberInput">选择牌堆中的第几张</label>
      <div class="number-row">
        <input class="number-input" id="cardNumberInput" type="number" inputmode="numeric" min="1" max="${total}" step="1" placeholder="1–${total}" autocomplete="off">
        <span class="number-range">/ ${total}</span>
      </div>
      <div class="picked-numbers">${state.chosenNumbers.map((value, index) => `<span class="picked-chip">第${index + 1}张：${value}</span>`).join('')}</div>
    </div>`;

  const submit = () => {
    const input = $('cardNumberInput');
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < 1 || value > total) {
      showToast(`请输入 1–${total} 的整数`);
      input.focus();
      return;
    }
    if (state.chosenNumbers.includes(value)) {
      showToast('这个数字已经选过了');
      input.select();
      return;
    }
    drawCardByNumber(value);
  };

  primary(required === 1 ? '按这个数字抽牌' : `确认第 ${next} 个数字`, submit);
  const input = $('cardNumberInput');
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  });
  setTimeout(() => input.focus(), 50);
}

function makeCard(selection) {
  const { card, orientation } = selection;
  const wrapper = document.createElement('div');
  wrapper.className = `tarot-card orientation-${orientation}`;
  wrapper.dataset.orientation = orientation;
  wrapper.dataset.cardId = card.id;
  wrapper.setAttribute('aria-label', `${card.name}${orientation === 'reversed' ? '逆位' : '正位'}，翻开后可放大查看`);
  wrapper.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-back"></div>
      <div class="card-face card-front">
        <div class="card-art">
          <div class="card-fallback" style="--cardA:${card.colors[0]};--cardB:${card.colors[1]}">
            <span class="card-number">${safe(card.deckCode || String(card.id).padStart(2, '0'))} · ${safe(card.en)}</span>
            <span class="card-symbol">${safe(card.symbol)}</span>
            <span class="card-name">${safe(card.name)}</span>
          </div>
          <img
            class="tarot-image"
            src="${safe(card.image)}"
            alt="${safe(card.name)}完整 Rider–Waite–Smith 牌面"
            loading="eager"
            decoding="async"
            onerror="this.hidden=true; this.parentElement.classList.add('image-error')"
          >
        </div>
      </div>
    </div>
    <span class="orientation-tag" aria-label="逆位">（逆）</span>
  `;
  return wrapper;
}

function drawCardByNumber(number, options = {}) {
  if (!state.shuffled || state.step !== 2) return;
  const required = requiredCardCount();
  if (state.selected.length >= required) return;

  const card = state.shuffledDeck[number - 1];
  if (!card) {
    showToast('没有找到这个编号，请重新选择');
    return;
  }

  const orientation = randomOrientation();
  const selection = { card, orientation, deckNumber: number, drawMode: state.drawMode || 'manual' };
  const targetIndex = state.selected.length;
  const slot = document.querySelector(`[data-slot="${targetIndex}"]`);
  slot.querySelector('.empty-label')?.remove();
  slot.insertBefore(makeCard(selection), slot.firstChild);

  state.selected.push(selection);
  state.chosenNumbers.push(number);
  createDeck();
  showToast(`第 ${number} 张已抽取 · ${state.selected.length}/${required}`);

  if (state.selected.length === required) {
    deck.classList.remove('fate-drawing');
    setTimeout(beginObservation, options.fate ? 760 : 500);
  } else if (state.drawMode === 'fate') {
    setTimeout(drawNextFateCard, 820);
  } else {
    setTimeout(promptCardNumber, 300);
  }
}

function revealCard(cardElement) {
  if (cardElement.classList.contains('revealed')) return;

  cardElement.classList.add('revealed');
  sparkle.classList.remove('show');
  void sparkle.offsetWidth;
  sparkle.classList.add('show');

  if (cardElement.dataset.orientation === 'reversed') {
    setTimeout(() => cardElement.classList.add('turn-reversed'), 650);
    setTimeout(() => markRevealComplete(cardElement), 1320);
  } else {
    setTimeout(() => markRevealComplete(cardElement), 800);
  }
}

function markRevealComplete(cardElement) {
  cardElement.classList.add('reveal-complete');
  const cards = [...document.querySelectorAll('.tarot-card')];
  if (cards.length && cards.every(card => card.classList.contains('reveal-complete'))) {
    setTimeout(askObservationCard, 280);
  }
}

function beginObservation() {
  state.step = 3;
  renderProgress();
  setDialogue(
    '牌已经选好了。先不要急着看解释。\n请依次轻触牌面把它翻开；逆位牌会在翻开后旋转180°，牌旁显示“（逆）”。'
  );
  document.querySelectorAll('.tarot-card').forEach(card => {
    card.onclick = () => revealCard(card);
  });
}

function parseSymbols(card) {
  return card.symbols.map(item => {
    if (typeof item === 'object') return item;
    const separator = item.includes('：') ? '：' : ':';
    const [name, ...rest] = item.split(separator);
    return { name: name.trim(), meaning: rest.join(separator).trim() || item };
  });
}

function orientationLabel(selection) {
  return selection.orientation === 'reversed' ? '（逆）' : '';
}

function askObservationCard() {
  if (state.selected.length === 1) {
    askSymbolObservation(0);
    return;
  }

  setDialogue(
    `${state.selected.length}张牌中，哪一张最先让你产生感觉？
先选择一张，再指出你注意到的画面线索。`,
    state.selected.map((selection, index) => ({
      label: `${index + 1}. ${selection.card.name}${orientationLabel(selection)}`,
      onClick: () => askSymbolObservation(index)
    }))
  );
}

function askSymbolObservation(cardIndex) {
  const selection = state.selected[cardIndex];
  const symbolOptions = parseSymbols(selection.card).slice(0, 4).map(symbol => ({
    label: symbol.name,
    onClick: () => saveObservation(cardIndex, symbol.name, symbol.meaning)
  }));

  symbolOptions.push(
    {
      label: '整体气氛',
      onClick: () => saveObservation(cardIndex, '整体气氛', selection.card.theme)
    },
    {
      label: '暂时没有感觉',
      onClick: () => saveObservation(cardIndex, '暂时没有感觉', '可以从现实事实、身体反应和牌阵位置开始理解。')
    }
  );

  setDialogue(
    `你选择了${selection.card.name}${orientationLabel(selection)}。\n第一眼最先注意到什么？`,
    symbolOptions
  );
}

function saveObservation(cardIndex, label, meaning) {
  state.observation = { cardIndex, label, meaning };
  state.step = 4;
  renderProgress();

  setDialogue(
    isDailyReading()
      ? `你先注意到了“${label}”。
接下来看看这张牌如何成为今天的提醒。`
      : isWeeklyReading()
        ? `你先注意到了“${label}”。
接下来看看这些牌如何共同描绘本周的观察地图。`
        : `你先注意到了“${label}”。
本地解读引擎会结合问题类型、正逆位、牌阵位置、共同主题和牌与牌之间的关系生成完整解读。`
  );

  document.querySelectorAll('.tarot-card').forEach((card, index) => {
    card.onclick = () => window.LifeMirrorViewer?.open(state.selected[index].card, state.selected[index].orientation);
  });

  if (isPeriodicReading()) window.LifeMirrorStorage?.save(getCurrentReadingSnapshot());
  ghost(isDailyReading() ? '记录今日感受' : isWeeklyReading() ? '记录本周感受' : '进入反思', beginReflection);
  primary(isDailyReading() ? '查看本日运势解读' : isWeeklyReading() ? '查看本周运势解读' : '查看完整牌阵解读', () => showFullInterpretation(cardIndex));
}

function isBinaryQuestion() {
  return /(会不会|能不能|可不可以|是不是|是否|有没有可能|一定会|能否)/.test(state.question);
}

function getOrientationData(selection) {
  return selection.orientation === 'upright'
    ? { core: selection.card.uprightCore, advice: selection.card.uprightAdvice }
    : { core: selection.card.reversedCore, advice: selection.card.reversedAdvice };
}

function buildCardAnswer(selection, position) {
  if (window.LifeMirrorV17) {
    return window.LifeMirrorV17.cardAnswer(selection, position, state.topic, state.question, isBinaryQuestion());
  }
  const { card, orientation } = selection;
  const data = getOrientationData(selection);
  const topicText = card.topics[state.topic] || card.theme;
  const orientationText = orientation === 'upright'
    ? '这股能量目前相对容易被看见和使用。'
    : '这股能量目前更可能以受阻、内化、过度或不足的方式出现。';

  const binaryText = isBinaryQuestion()
    ? '这张牌不把问题简化成“是”或“否”，而是指出影响结果的关键条件。'
    : '';

  const relationshipText = state.topic === 'relationship'
    ? '它不能确认第三方未表达的真实想法，重点是你能观察到的互动、边界和行为。'
    : '';

  return [
    `${position.prompt}`,
    binaryText,
    topicText,
    orientationText,
    data.core,
    relationshipText,
    `建议：${data.advice}`
  ].filter(Boolean).join(' ');
}

function positionSpecificText(selection, position) {
  if (window.LifeMirrorV17) {
    return window.LifeMirrorV17.positionText(selection.card, state.topic, selection.orientation, position.role);
  }
  const { card, orientation } = selection;
  const data = getOrientationData(selection);

  if (position.role === '现状') {
    return orientation === 'upright'
      ? `${card.name}显示这股能量已经出现在现实中。先承认当前状态，再决定如何使用它。`
      : `${card.name}逆位说明现状中的主要困难不是“没有这股能量”，而是它被卡住、过度或表达失衡。`;
  }

  if (position.role === '盲点') {
    return orientation === 'upright'
      ? `${card.name}指出一个已经存在、但容易被忽略的资源或事实。`
      : `${card.name}逆位指出被忽略的阻塞点：${card.shadow}`;
  }

  if (position.role === '行动') {
    return orientation === 'upright'
      ? `把${card.name}落实为行动：${data.advice}`
      : `不要直接模仿它的正位表现，先修正逆位中的失衡：${data.advice}`;
  }

  return orientation === 'upright'
    ? `${card.name}是本次问题的核心观察角度，可以直接从它的资源面开始。`
    : `${card.name}逆位是本次问题的核心调整点，先处理阻塞，再追问外部结果。`;
}

function getRepeatedEnergyInsight() {
  const counts = new Map();

  state.selected.forEach(selection => {
    selection.card.energies.forEach(energy => {
      counts.set(energy, (counts.get(energy) || 0) + 1);
    });
  });

  const repeated = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  if (!repeated.length) return null;

  const [energy] = repeated[0];
  return `共同主题“${energy}”：${ENERGY_EXPLANATIONS[energy] || '这一主题在多张牌中重复出现，值得优先关注。'}`;
}

function getOrientationPatternInsight() {
  if (state.selected.length === 1) {
    return state.selected[0].orientation === 'upright'
      ? '单牌为正位：这股能量比较容易直接辨认和使用，但仍需留意其阴影。'
      : '单牌为逆位：重点不是坏结果，而是辨认能量受阻、过度、内化或不足的具体表现。';
  }

  if (state.selected.length === 3) {
    const pattern = state.selected.map(item => item.orientation === 'upright' ? 'U' : 'R').join('');
    const map = {
      UUU: '三张均为正位：牌阵路径较连贯，重点在落实，而不是继续等待更多答案。',
      RRR: '三张均为逆位：阻力更多来自尚未整理的内在矛盾、信息或旧模式，暂不宜强行推进。',
      RUU: '从逆位走向两张正位：起点存在阻塞，但看见盲点后，局面有机会进入可执行状态。',
      URU: '中间牌逆位：当前状态与行动方向并非完全不清楚，真正的难点在于尚未看见或承认的部分。',
      UUR: '行动牌逆位：理解可能已经形成，但落地方式仍需调整，避免用力过度或复制旧做法。',
      RRU: '前两张逆位、最后正位：先处理现状和认知中的阻力，行动方向本身相对明确。',
      URR: '现状牌正位、后两张逆位：眼前状况较可见，但解释方式和行动方案仍容易失衡。',
      RUR: '中间牌正位：你可能已经看见关键角度，但起点和执行仍需要修正。'
    };
    return map[pattern];
  }

  const reversed = state.selected.filter(item => item.orientation === 'reversed').length;
  if (reversed === 0) return `${state.selected.length}张牌均为正位：本周主题较容易显现，重点在安排优先级并落实行动。`;
  if (reversed === state.selected.length) return `${state.selected.length}张牌均为逆位：本周更适合整理阻力、修正节奏和补足条件，不宜把所有问题都推向外部。`;
  if (reversed > state.selected.length / 2) return `${reversed}张逆位占多数：本周的主要工作是调整内部失衡、信息缺口和执行节奏。`;
  return `正逆位分布较均衡：本周既有可直接使用的力量，也有需要逐项修正的部分。`;
}

function getDeckStructureInsights() {
  const insights = [];
  const majorCount = state.selected.filter(item => item.card.arcana === 'major').length;
  const suitLabels = { s: '宝剑', w: '权杖', c: '圣杯', p: '星币' };
  const suitThemes = {
    s: '思想、沟通与事实判断',
    w: '行动、动力与创造方向',
    c: '感受、关系与直觉回应',
    p: '现实资源、身体与长期建设'
  };

  if (state.selected.length === 1) {
    const card = state.selected[0].card;
    insights.push(card.arcana === 'major'
      ? '这是一张大阿尔卡那：问题可能触及较深的价值、身份或人生阶段主题。'
      : `这是一张${suitLabels[card.suit]}牌：重点更靠近日常中的${suitThemes[card.suit]}。`);
    return insights;
  }

  if (majorCount >= 2) {
    insights.push(`牌阵中有 ${majorCount} 张大阿尔卡那：这件事可能不只是短期事件，也与较深的价值、身份或长期模式有关。`);
  } else if (majorCount === 0) {
    insights.push(`${state.selected.length}张均为小阿尔卡那：重点更靠近日常行为、沟通、情绪和现实资源，适合从具体调整开始。`);
  }

  const suitCounts = new Map();
  state.selected.forEach(({ card }) => {
    if (card.suit) suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  });
  const repeatedSuit = [...suitCounts.entries()].sort((a,b) => b[1]-a[1]).find(([,count]) => count >= 2);
  if (repeatedSuit) {
    const [suit, count] = repeatedSuit;
    insights.push(`${count} 张${suitLabels[suit]}重复出现：牌阵特别强调${suitThemes[suit]}。`);
  }
  return insights;
}

function getPairInsights() {
  if (state.selected.length < 2) return [];

  const ids = new Set(state.selected.map(item => item.card.id));
  return COMBINATION_RULES
    .filter(rule => rule.ids.every(id => ids.has(id)))
    .slice(0, 2)
    .map(rule => rule.text);
}

function analyzePatterns() {
  const insights = [];
  const orientation = getOrientationPatternInsight();
  const energy = getRepeatedEnergyInsight();

  if (orientation) insights.push(orientation);
  insights.push(...getDeckStructureInsights());
  if (energy) insights.push(energy);
  insights.push(...getPairInsights());
  if (window.LifeMirrorV17) insights.push(...window.LifeMirrorV17.extraPatterns(state.selected));

  if (state.observation) {
    const selection = state.selected[state.observation.cardIndex];
    insights.push(
      `你的第一印象落在${selection.card.name}${orientationLabel(selection)}的“${state.observation.label}”：${state.observation.meaning}`
    );
  }

  return insights.slice(0, 8);
}

function buildSingleSummary() {
  const selection = state.selected[0];
  const position = getPositions()[0];
  if (window.LifeMirrorV17) return window.LifeMirrorV17.buildSingleSummary({ selection, position, topic: state.topic, question: state.question, binary: isBinaryQuestion() });
  return [
    `关于“${state.question}”，${selection.card.name}${orientationLabel(selection)}没有给出一个固定预言，而是把注意力放在“${selection.card.theme}”上。`,
    buildCardAnswer(selection, position),
    `最适合落实的一步是：${getOrientationData(selection).advice}`
  ].join('\n\n');
}

function buildThreeCardSummary() {
  const positions = getPositions();
  const topic = TOPICS[state.topic];
  if (window.LifeMirrorV17) return window.LifeMirrorV17.buildThreeSummary({ selected: state.selected, positions, topic: state.topic, question: state.question, binary: isBinaryQuestion(), topicNote: topic.note });

  const intro = `关于“${state.question}”，三张牌形成“${positions.map(position => position.label).join('—')}”的发展路径。`;
  const lines = state.selected.map((selection, index) => `${positions[index].label}｜${selection.card.name}${orientationLabel(selection)}：${getOrientationData(selection).core}`);
  return [intro, ...lines, `综合方向：${topic.note}`].join('\n\n');
}

function buildOverallSummary() {
  if (state.selected.length === 1) return buildSingleSummary();
  if (state.selected.length === 3) return buildThreeCardSummary();
  const positions = getPositions();
  if (window.LifeMirrorV17?.buildMultiSummary) {
    return window.LifeMirrorV17.buildMultiSummary({ selected: state.selected, positions, topic: state.topic, question: state.question, topicNote: TOPICS[state.topic]?.note || '' });
  }
  return [
    `关于“${state.question}”，这组牌形成一张由${state.selected.length}个位置组成的观察地图。`,
    ...state.selected.map((selection, index) => `${positions[index].label}｜${selection.card.name}${orientationLabel(selection)}：${getOrientationData(selection).core}`),
    `综合方向：${TOPICS[state.topic]?.note || ''}`
  ].join('\n\n');
}

function cardReadingHTML(selection, index, position) {
  const { card, orientation } = selection;
  const data = getOrientationData(selection);
  const orientationText = orientation === 'upright' ? '正位' : '逆位';
  const symbolHtml = parseSymbols(card)
    .map(symbol => `<span class="symbol-chip"><strong>${safe(symbol.name)}</strong>：${safe(symbol.meaning)}</span>`)
    .join('');

  const questionHtml = card.questions.map(question => `<li>${safe(question)}</li>`).join('');
  const observation = state.observation?.cardIndex === index
    ? `<section class="observation-note">
        <h3>你的第一印象</h3>
        <p>你先注意到“${safe(state.observation.label)}”。${safe(state.observation.meaning)}</p>
      </section>`
    : '';

  return `
    <article class="card-reading" id="card-reading-${index}">
      <figure class="reading-card-preview ${orientation}" role="button" tabindex="0" data-card-id="${card.id}" data-orientation="${orientation}" aria-label="放大查看${safe(card.name)}${orientation === 'reversed' ? '逆位' : '正位'}牌面">
        <div class="reading-image-frame">
          <img
            src="${safe(card.image)}"
            alt="${safe(card.name)}完整牌面"
            loading="lazy"
            decoding="async"
            onerror="this.closest('.reading-card-preview').classList.add('image-error')"
          >
          <div class="reading-image-fallback" style="--cardA:${card.colors[0]};--cardB:${card.colors[1]}">
            <span>${safe(card.symbol)}</span>
            <strong>${safe(card.name)}</strong>
          </div>
        </div>
        <figcaption>${safe(card.name)}${orientationLabel(selection)} · ${orientationText}</figcaption>
      </figure>
      <header class="card-reading-header">
        <div>
          <span class="tiny-label">第${index + 1}张 · ${selection.drawMode === 'fate' ? '交给命运' : '自选编号'} ${selection.deckNumber ?? "—"} · ${safe(position.label)} · ${safe(position.role)}</span>
          <h2>${safe(card.name)}${orientationLabel(selection)} · ${safe(card.en)}</h2>
          <p>${safe(card.theme)}</p>
        </div>
        <span class="orientation-badge ${orientation}">${orientationText}</span>
      </header>

      <section class="answer-block">
        <h3>这张牌在回答什么</h3>
        <p>${safe(buildCardAnswer(selection, position))}</p>
      </section>

      <section class="topic-meaning-v15">
        <h3>结合“${safe(TOPICS[state.topic].label)}”的${orientationText}解读</h3>
        <p>${safe(window.LifeMirrorV17?.topicText(card, state.topic, orientation) || card.topics[state.topic] || card.theme)}</p>
      </section>

      <section class="orientation-meaning ${orientation}">
        <h3>${orientationText}核心牌意</h3>
        <p>${safe(data.core)}</p>
      </section>

      <section>
        <h3>在“${safe(position.label)}”位置上</h3>
        <p>${safe(positionSpecificText(selection, position))}</p>
      </section>

      ${observation}

      <section class="two-columns">
        <div class="meaning resource">
          <h3>可以使用的力量</h3>
          <p>${safe(card.resource)}</p>
        </div>
        <div class="meaning shadow">
          <h3>需要留意的阴影</h3>
          <p>${safe(card.shadow)}</p>
        </div>
      </section>

      <section class="action-note">
        <h3>本地行动建议</h3>
        <p>${safe(data.advice)}</p>
      </section>

      <details>
        <summary>查看画面和象征</summary>
        <p>${safe(card.visual)}</p>
        <div class="symbol-list">${symbolHtml}</div>
      </details>

      <details>
        <summary>查看反思问题</summary>
        <ul>${questionHtml}</ul>
      </details>
    </article>
  `;
}

function showFullInterpretation(focusIndex = 0) {
  const positions = getPositions();
  const insights = analyzePatterns();
  const periodic = isPeriodicReading();
  const modeLabel = positions.length === 1 ? '单牌规则解读' : `${positions.length}张牌规则解读`;
  $('interpretSpreadLabel').innerHTML = `<span class="interpretation-engine-badge">✦ V17 本周运势</span><br>${modeLabel}`;
  $('interpretTitle').textContent = isDailyReading()
    ? '本日运势解读'
    : isWeeklyReading()
      ? '本周运势解读'
      : (isSingleSpread() ? '本次牌意解读' : '完整牌阵解读');
  $('interpretTheme').textContent = isDailyReading()
    ? '把牌面当作今天的观察提示，核对现实后再决定如何行动。'
    : isWeeklyReading()
      ? `本周范围：${state.periodLabel || getLocalWeekInfo().label}。把牌面作为规划一周的观察地图，而不是不可改变的预言。`
      : `问题类型：${TOPICS[state.topic].label}。内容由78张牌义、正逆位主题、牌阵位置和组合关系共同生成。`;
  $('spreadAnswer').textContent = buildOverallSummary();

  $('patternList').innerHTML = insights.map(item => `<li>${safe(item)}</li>`).join('');

  const narrativeLinks = window.LifeMirrorV17?.narrativeLinks(state.selected, positions, state.topic) || [];
  const narrativeSection = $('narrativeSection');
  if (narrativeSection) narrativeSection.hidden = !narrativeLinks.length;
  if ($('narrativeList')) $('narrativeList').innerHTML = narrativeLinks.slice(0, 8).map(item => `<li>${safe(item)}</li>`).join('');

  $('interpretationList').innerHTML = state.selected
    .map((selection, index) => cardReadingHTML(selection, index, positions[index]))
    .join('');

  panel.hidden = false;

  document.querySelectorAll('.reading-card-preview').forEach(preview => {
    const openPreview = () => window.LifeMirrorViewer?.open(Number(preview.dataset.cardId), preview.dataset.orientation);
    preview.onclick = openPreview;
    preview.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPreview(); } };
  });
  $('shareReadingBtn').onclick = () => window.LifeMirrorShare?.open(getCurrentReadingSnapshot());
  $('reflectionFromReadingBtn').onclick = beginReflection;

  requestAnimationFrame(() => {
    const safeIndex = Math.max(0, Math.min(focusIndex, state.selected.length - 1));
    const target = $(`card-reading-${safeIndex}`);
    document.querySelectorAll('.card-reading').forEach(card => card.classList.remove('active'));
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  });
}

function beginReflection() {
  panel.hidden = true;
  state.step = 5;
  renderProgress();

  setDialogue(
    isDailyReading()
      ? '今天最值得带走的是哪一句提醒？'
      : isWeeklyReading()
        ? '本周最值得记住的主线是什么？'
        : '本地规则给出的是一套可核对的解释，而不是最终判决。\n结合你的真实处境，哪一点最像是在描述现在？'
  );

  const reflectionPlaceholder = isDailyReading()
    ? '写下今天最有感觉的一点……'
    : isWeeklyReading()
      ? '写下本周最值得留意的主题……'
      : '写下你自己的理解，而不是照抄牌义……';
  showInput('textarea', reflectionPlaceholder, state.reflection, value => {
    state.reflection = value;
    setDialogue(isDailyReading()
      ? '为今天留一个小而具体的行动。'
      : isWeeklyReading()
        ? '为本周安排一个可执行、可以在周末回看的行动。'
        : '最后，为自己留一个小而具体、可以验证的下一步。');
    const actionPlaceholder = isDailyReading()
      ? '例如：今天先完成最重要的一件小事。'
      : isWeeklyReading()
        ? '例如：周三前完成关键任务，并预留一次恢复时间。'
        : '例如：把事实与猜测分开写下来，并进行一次直接沟通。';
    showInput('textarea', actionPlaceholder, state.nextAction, action => {
      state.nextAction = action;
      completeSession();
    });
  });
}

function getCurrentReadingSnapshot() {
  const positions = getPositions();
  return {
    id: state.recordId || undefined,
    timestamp: Date.now(),
    date: new Date().toLocaleString(),
    readingType: state.readingType || 'reflection',
    dayKey: state.dayKey || '',
    weekKey: state.weekKey || '',
    periodLabel: state.periodLabel || '',
    dailyMode: isDailyReading() ? (isSingleSpread() ? 'single' : 'three') : '',
    weeklyMode: isWeeklyReading() ? (state.spread === 'weekly-seven' ? 'seven' : 'three') : '',
    topicKey: state.topic,
    topic: TOPICS[state.topic]?.label || '自我反思',
    question: state.question,
    spread: state.spread,
    drawMode: state.drawMode || 'manual',
    cards: state.selected.map((item, index) => ({
      id: item.card.id,
      name: item.card.name,
      en: item.card.en,
      image: item.card.image,
      orientation: item.orientation,
      position: positions[index]?.label || '此刻需要看见',
      deckNumber: item.deckNumber ?? null,
      drawMode: item.drawMode || state.drawMode || 'manual'
    })),
    summary: buildOverallSummary(),
    observation: state.observation,
    reflection: state.reflection,
    nextAction: state.nextAction
  };
}

function completeSession() {
  const record = window.LifeMirrorStorage.save(getCurrentReadingSnapshot());
  const text = isDailyReading()
    ? `今天的运势记录已保存在当前设备。

你的感受：
${state.reflection}

今日行动：
${state.nextAction}`
    : isWeeklyReading()
      ? `本周运势记录已保存在当前设备。

本周主线：
${state.reflection}

本周行动：
${state.nextAction}`
      : `这次记录已保存在当前设备。

你的问题：
${state.question}

你自己的理解：
${state.reflection}

下一步：
${state.nextAction}`;
  setDialogue(text);
  ghost('查看完整解读', () => showFullInterpretation(0));
  ghost('生成分享卡', () => window.LifeMirrorShare?.open(record));
  primary('返回首页', reset);
}

function chooseTopic() {
  state.readingType = 'reflection';
  state.dayKey = '';
  state.weekKey = '';
  state.periodLabel = '';
  state.recordId = '';
  state.step = 1;
  renderProgress();

  setDialogue('今天你想把注意力放在哪一方面？', [
    { label: '关系', onClick: () => setTopic('relationship') },
    { label: '学习与工作', onClick: () => setTopic('work') },
    { label: '个人成长', onClick: () => setTopic('growth') },
    { label: '情绪状态', onClick: () => setTopic('emotion') },
    { label: '一个具体决定', onClick: () => setTopic('decision') }
  ]);
}

function setTopic(topicKey) {
  state.topic = topicKey;
  setDialogue(
    `你选择了“${TOPICS[topicKey].label}”。\n试着把问题写成能够帮助自己观察、比较和行动的形式。`
  );

  showInput(
    'text',
    '例如：面对这件事，我现在最需要看清什么？',
    '',
    question => {
      state.question = question;
      chooseSpread();
    }
  );
}

function chooseSpread() {
  setDialogue(
    `你的问题是：\n“${state.question}”\n\n请选择抽牌方式。`,
    [
      { label: '一张牌 · 聚焦当下', onClick: () => setSpread('single') },
      { label: '三张牌 · 状态/看见/行动', onClick: () => setSpread('three') }
    ]
  );
}

function setSpread(spread) {
  state.spread = spread;
  renderSlots();
  state.step = 2;
  renderProgress();
  state.shuffleCount = 0;
  state.shuffled = false;
  state.shuffledDeck = [];
  state.chosenNumbers = [];
  state.drawMode = '';
  createDeck();

  setDialogue(
    isDailyReading()
      ? '把注意力放在今天，然后点击牌堆三次。\n电脑端也可以连续按三次空格键。'
      : isWeeklyReading()
        ? `把注意力放在${state.periodLabel || '这一周'}，然后点击牌堆三次。\n电脑端也可以连续按三次空格键。`
        : '在心里轻轻重复你的问题，然后点击牌堆三次。\n电脑端也可以连续按三次空格键。'
  );

  primary('快速洗牌', () => {
    if (state.shuffled) return;
    const remaining = Math.max(0, 3 - state.shuffleCount);
    for (let index = 0; index < remaining; index++) setTimeout(shuffleOnce, index * 170);
  });
}

function restoreSavedReading(record) {
  const selected = (record.cards || []).map(raw => {
    const card = TAROT_CARDS.find(item => item.id === raw.id) || TAROT_CARDS.find(item => item.name === raw.name);
    return card ? {
      card,
      orientation: raw.orientation === 'reversed' ? 'reversed' : 'upright',
      deckNumber: raw.deckNumber ?? null,
      drawMode: raw.drawMode || record.drawMode || 'manual'
    } : null;
  }).filter(Boolean);

  if (!selected.length) {
    showToast('这条记录缺少可读取的牌面');
    return;
  }

  const readingType = record.readingType || 'daily';
  const defaultSpread = readingType === 'weekly'
    ? (selected.length === 7 ? 'weekly-seven' : 'weekly-three')
    : (selected.length === 1 ? 'daily-single' : 'daily-three');
  Object.assign(state, {
    step: 4,
    topic: record.topicKey || readingType,
    question: record.question || (readingType === 'weekly' ? '本周的整体运势与提醒是什么？' : '今天的整体运势与提醒是什么？'),
    spread: record.spread || defaultSpread,
    shuffleCount: 3,
    shuffled: false,
    selected,
    observation: record.observation || null,
    reflection: record.reflection || '',
    nextAction: record.nextAction || '',
    shuffledDeck: [],
    chosenNumbers: selected.map(item => item.deckNumber).filter(Number.isInteger),
    drawMode: record.drawMode || 'manual',
    readingType,
    dayKey: record.dayKey || (readingType === 'daily' ? localDayKey() : ''),
    weekKey: record.weekKey || (readingType === 'weekly' ? getLocalWeekInfo().key : ''),
    periodLabel: record.periodLabel || (readingType === 'weekly' ? getLocalWeekInfo().label : ''),
    recordId: record.id || (readingType === 'weekly' ? `weekly-${getLocalWeekInfo().key}` : `daily-${localDayKey()}`)
  });

  panel.hidden = true;
  clearDeck();
  renderSlots();
  renderProgress();

  state.selected.forEach((selection, index) => {
    const slot = document.querySelector(`[data-slot="${index}"]`);
    slot?.querySelector('.empty-label')?.remove();
    const cardElement = makeCard(selection);
    cardElement.classList.add('revealed', 'reveal-complete');
    if (selection.orientation === 'reversed') cardElement.classList.add('turn-reversed');
    slot?.insertBefore(cardElement, slot.firstChild);
    cardElement.onclick = () => window.LifeMirrorViewer?.open(selection.card, selection.orientation);
  });

  setDialogue(isWeeklyReading()
    ? `这是你在${state.periodLabel}留下的本周运势。先回看第一次抽取，再安排本周行动。`
    : '这是你今天已经留下的本日运势。先回看第一次抽取，再决定今天如何行动。');
  ghost(isWeeklyReading() ? '记录本周感受' : '记录今日感受', beginReflection);
  primary(isWeeklyReading() ? '查看本周运势解读' : '查看本日运势解读', () => showFullInterpretation(0));
}

function chooseDailySpread() {
  Object.assign(state, {
    step: 1,
    topic: 'daily',
    question: '今天的整体运势与提醒是什么？',
    spread: 'daily-single',
    shuffleCount: 0,
    shuffled: false,
    selected: [],
    observation: null,
    reflection: '',
    nextAction: '',
    shuffledDeck: [],
    chosenNumbers: [],
    drawMode: '',
    readingType: 'daily',
    dayKey: localDayKey(),
    recordId: `daily-${localDayKey()}`
  });

  panel.hidden = true;
  renderProgress();
  renderSlots();
  clearDeck();

  setDialogue('选择今天的牌阵。', [
    { label: '一张牌 · 今日主题', onClick: () => setSpread('daily-single') },
    { label: '三张牌 · 主线/留意/行动', onClick: () => setSpread('daily-three') }
  ]);
}

function beginDailyFortune() {
  const existing = getTodayReading();
  if (!existing) {
    chooseDailySpread();
    return;
  }

  setDialogue('今天已经留下了一次本日运势。建议先回看第一次抽取。', [
    { label: '查看今日运势', onClick: () => restoreSavedReading(existing) },
    {
      label: '重新抽取',
      onClick: () => {
        if (confirm('重新抽取会覆盖今天原来的本日运势记录。确定继续吗？')) chooseDailySpread();
      }
    },
    { label: '返回', onClick: reset }
  ]);
}


function chooseWeeklySpread() {
  const week = getLocalWeekInfo();
  Object.assign(state, {
    step: 1,
    topic: 'weekly',
    question: '本周的整体运势与提醒是什么？',
    spread: 'weekly-three',
    shuffleCount: 0,
    shuffled: false,
    selected: [],
    observation: null,
    reflection: '',
    nextAction: '',
    shuffledDeck: [],
    chosenNumbers: [],
    drawMode: '',
    readingType: 'weekly',
    dayKey: '',
    weekKey: week.key,
    periodLabel: week.label,
    recordId: `weekly-${week.key}`
  });

  panel.hidden = true;
  renderProgress();
  renderSlots();
  clearDeck();

  setDialogue(`本周范围：${week.label}
选择本周牌阵。`, [
    { label: '三张牌 · 主线/挑战/力量', onClick: () => setSpread('weekly-three') },
    { label: '七张牌 · 完整本周地图', onClick: () => setSpread('weekly-seven') }
  ]);
}

function beginWeeklyFortune() {
  const existing = getThisWeekReading();
  if (!existing) {
    chooseWeeklySpread();
    return;
  }

  setDialogue(`本周（${existing.periodLabel || getLocalWeekInfo().label}）已经留下了一次运势。建议先回看第一次抽取。`, [
    { label: '查看本周运势', onClick: () => restoreSavedReading(existing) },
    {
      label: '重新抽取',
      onClick: () => {
        if (confirm('重新抽取会覆盖本周原来的运势记录。确定继续吗？')) chooseWeeklySpread();
      }
    },
    { label: '返回', onClick: reset }
  ]);
}

function breathe() {
  setDialogue('慢慢吸气……');
  const sequence = ['稍作停留……', '缓缓呼气……', '准备好了。'];
  let index = 0;

  const timer = setInterval(() => {
    message.textContent = sequence[index++];
    if (index === sequence.length) {
      clearInterval(timer);
      actions.innerHTML = '';
      primary('继续', chooseTopic);
    }
  }, 1200);
}

function renderHistory() { window.LifeMirrorHistory?.render(); }

function start() {
  state.step = 0;
  state.readingType = 'reflection';
  renderProgress();
  renderSlots();
  clearDeck();

  const daily = getTodayReading();
  const weekly = getThisWeekReading();
  setDialogue(
    '欢迎来到生命之镜。\n“如上，如下；如内，如外。”',
    [
      { label: '开始一次抽牌', onClick: chooseTopic },
      { label: daily ? '查看今日运势' : '本日运势', onClick: beginDailyFortune },
      { label: weekly ? '查看本周运势' : '本周运势', onClick: beginWeeklyFortune },
      { label: '先做一次呼吸', onClick: breathe }
    ]
  );
}

function reset() {
  Object.assign(state, {
    step: 0,
    topic: '',
    question: '',
    spread: 'single',
    shuffleCount: 0,
    shuffled: false,
    selected: [],
    observation: null,
    reflection: '',
    nextAction: '',
    shuffledDeck: [],
    chosenNumbers: [],
    drawMode: '',
    readingType: 'reflection',
    dayKey: '',
    weekKey: '',
    periodLabel: '',
    recordId: ''
  });

  panel.hidden = true;
  hands.className = 'hands';
  start();
}

deck.addEventListener('click', () => {
  if (!state.shuffled) shuffleOnce();
});

deck.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && !state.shuffled) {
    event.preventDefault();
    shuffleOnce();
  }
});

document.addEventListener('keydown', event => {
  if (
    event.code === 'Space' &&
    state.step === 2 &&
    !state.shuffled &&
    !['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName)
  ) {
    event.preventDefault();
    shuffleOnce();
  }
});

$('resetBtn').onclick = reset;
$('closeInterpretation').onclick = () => panel.hidden = true;
$('aboutBtn').onclick = () => $('aboutDialog').showModal();
$('closeAbout').onclick = () => $('aboutDialog').close();
$('libraryBtn').onclick = () => window.LifeMirrorLibrary?.open();
$('historyBtn').onclick = () => window.LifeMirrorHistory?.open();
$('aboutPrivacyBtn').onclick = () => { $('aboutDialog').close(); $('privacyDialog').showModal(); };
$('closePrivacy').onclick = () => $('privacyDialog').close();

window.LifeMirrorApp = { showToast, getCurrentReadingSnapshot, showFullInterpretation, reset };
window.LifeMirrorViewer?.init();
window.LifeMirrorLibrary?.init();
window.LifeMirrorShare?.init();
window.LifeMirrorHistory?.init();

const requestedAction = new URLSearchParams(location.search).get('action');
start();
if (requestedAction === 'history') setTimeout(() => window.LifeMirrorHistory?.open(), 200);
if (requestedAction === 'library') setTimeout(() => window.LifeMirrorLibrary?.open(), 200);
if (requestedAction === 'daily') setTimeout(beginDailyFortune, 200);
if (requestedAction === 'weekly') setTimeout(beginWeeklyFortune, 200);
