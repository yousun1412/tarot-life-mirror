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
  chosenNumbers: []
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

function getPositions() {
  return state.spread === 'single'
    ? [POSITION_RULES.single]
    : [POSITION_RULES.current, POSITION_RULES.awareness, POSITION_RULES.action];
}

function renderSlots() {
  document.querySelector('.spread')?.classList.toggle('single-mode', state.spread === 'single');
  document.querySelectorAll('.slot').forEach((slot, index) => {
    const labels = ['当前状态', state.spread === 'single' ? '此刻需要看见' : '需要看见', '可以行动'];
    slot.innerHTML = `<span class="empty-label">${labels[index]}</span><span class="slot-label">${labels[index]}</span>`;
    slot.classList.toggle('hidden', state.spread === 'single' && index !== 1);
  });
}

function clearDeck() {
  deck.className = 'deck-wrap';
  deck.innerHTML = '<div class="deck-placeholder">牌会在这里出现</div>';
}

function createDeck() {
  deck.innerHTML = '';
  deck.className = `deck-wrap${state.shuffled ? ' ready-stack' : ''}`;
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
    ? `牌保持叠放 · 从 1–${total} 中选择编号`
    : '点击牌堆三次，或按空格键';
  deck.appendChild(hint);
  deck.setAttribute('aria-label', state.shuffled
    ? `已洗好的${total}张牌。请在下方输入编号抽牌。`
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

function shuffledCopy(cards) {
  const result = [...cards];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function finishShuffle() {
  if (state.shuffled) return;
  state.shuffled = true;
  state.shuffledDeck = shuffledCopy(TAROT_CARDS);
  state.chosenNumbers = [];
  createDeck();
  promptCardNumber();
}

function promptCardNumber() {
  const total = state.shuffledDeck.length;
  const required = state.spread === 'single' ? 1 : 3;
  const next = state.chosenNumbers.length + 1;
  const pickedText = state.chosenNumbers.length
    ? `\n已选择：${state.chosenNumbers.join('、')}`
    : '';

  setDialogue(
    state.spread === 'single'
      ? `牌已经洗好，并保持叠成一摞。\n请凭第一感觉选择 1–${total} 中的一个数字。`
      : `牌已经洗好，并保持叠成一摞。\n请选择第 ${next}/${required} 个数字（1–${total}），三个数字不能重复。${pickedText}`
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

  primary(state.spread === 'single' ? '按这个数字抽牌' : `确认第 ${next} 个数字`, submit);
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

function drawCardByNumber(number) {
  if (!state.shuffled || state.step !== 2) return;
  const required = state.spread === 'single' ? 1 : 3;
  if (state.selected.length >= required) return;

  const card = state.shuffledDeck[number - 1];
  if (!card) {
    showToast('没有找到这个编号，请重新选择');
    return;
  }

  const orientation = Math.random() < 0.5 ? 'upright' : 'reversed';
  const selection = { card, orientation, deckNumber: number };
  const targetIndex = state.spread === 'single' ? 1 : state.selected.length;
  const slot = document.querySelector(`[data-slot="${targetIndex}"]`);
  slot.querySelector('.empty-label')?.remove();
  slot.insertBefore(makeCard(selection), slot.firstChild);

  state.selected.push(selection);
  state.chosenNumbers.push(number);
  createDeck();
  showToast(`第 ${number} 张已抽取 · ${state.selected.length}/${required}`);

  if (state.selected.length === required) {
    setTimeout(beginObservation, 500);
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
    '三张牌中，哪一张最先让你产生感觉？\n先选择一张，再指出你注意到的画面线索。',
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
    `你先注意到了“${label}”。\n本地解读引擎会结合问题类型、正逆位、牌阵位置、共同主题和牌与牌之间的关系生成完整解读。`
  );

  document.querySelectorAll('.tarot-card').forEach((card, index) => {
    card.onclick = () => window.LifeMirrorViewer?.open(state.selected[index].card, state.selected[index].orientation);
  });

  ghost('进入反思', beginReflection);
  primary('查看完整牌阵解读', () => showFullInterpretation(cardIndex));
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
    insights.push('三张均为小阿尔卡那：重点更靠近日常行为、沟通、情绪和现实资源，适合从具体调整开始。');
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

  if (state.observation) {
    const selection = state.selected[state.observation.cardIndex];
    insights.push(
      `你的第一印象落在${selection.card.name}${orientationLabel(selection)}的“${state.observation.label}”：${state.observation.meaning}`
    );
  }

  return insights.slice(0, 5);
}

function buildSingleSummary() {
  const selection = state.selected[0];
  const position = POSITION_RULES.single;
  return [
    `关于“${state.question}”，${selection.card.name}${orientationLabel(selection)}没有给出一个固定预言，而是把注意力放在“${selection.card.theme}”上。`,
    buildCardAnswer(selection, position),
    `最适合落实的一步是：${getOrientationData(selection).advice}`
  ].join('\n\n');
}

function buildThreeCardSummary() {
  const positions = getPositions();
  const [current, awareness, action] = state.selected;
  const topic = TOPICS[state.topic];

  const intro = isBinaryQuestion()
    ? `关于“${state.question}”，这组三张牌不适合被压缩成简单的“会”或“不会”。它更像一条从现状、盲点到行动条件的路径。`
    : `关于“${state.question}”，这组三张牌形成了一条“当前状态—需要看见—可以行动”的路径。`;

  const relationshipNote = state.topic === 'relationship'
    ? '\n\n这套规则不会确认对方未表达的内心事实，只依据牌面帮助你观察互动、边界和可以验证的行为。'
    : '';

  return [
    intro,
    `当前状态｜${current.card.name}${orientationLabel(current)}：${getOrientationData(current).core}`,
    `需要看见｜${awareness.card.name}${orientationLabel(awareness)}：${getOrientationData(awareness).core}`,
    `可以行动｜${action.card.name}${orientationLabel(action)}：${getOrientationData(action).advice}`,
    `综合方向：${topic.note}${relationshipNote}`
  ].join('\n\n');
}

function buildOverallSummary() {
  return state.selected.length === 1 ? buildSingleSummary() : buildThreeCardSummary();
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
          <span class="tiny-label">第${index + 1}张 · 选择牌堆编号 ${selection.deckNumber ?? "—"} · ${safe(position.label)} · ${safe(position.role)}</span>
          <h2>${safe(card.name)}${orientationLabel(selection)} · ${safe(card.en)}</h2>
          <p>${safe(card.theme)}</p>
        </div>
        <span class="orientation-badge ${orientation}">${orientationText}</span>
      </header>

      <section class="answer-block">
        <h3>这张牌在回答什么</h3>
        <p>${safe(buildCardAnswer(selection, position))}</p>
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

  $('interpretSpreadLabel').textContent = state.spread === 'single' ? '单牌规则解读' : '三牌规则解读';
  $('interpretTitle').textContent = state.spread === 'single' ? '本次牌意解读' : '完整牌阵解读';
  $('interpretTheme').textContent = `问题类型：${TOPICS[state.topic].label}。内容由本地规则、牌义资料和组合条件生成，没有调用大模型。`;
  $('spreadAnswer').textContent = buildOverallSummary();

  $('patternList').innerHTML = insights
    .map(item => `<li>${safe(item)}</li>`)
    .join('');

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
    '本地规则给出的是一套可核对的解释，而不是最终判决。\n结合你的真实处境，哪一点最像是在描述现在？'
  );

  showInput('textarea', '写下你自己的理解，而不是照抄牌义……', '', value => {
    state.reflection = value;
    setDialogue('最后，为自己留一个小而具体、可以验证的下一步。');
    showInput('textarea', '例如：把事实与猜测分开写下来，并进行一次直接沟通。', '', action => {
      state.nextAction = action;
      completeSession();
    });
  });
}

function getCurrentReadingSnapshot() {
  const positions = getPositions();
  return {
    timestamp: Date.now(),
    date: new Date().toLocaleString(),
    topicKey: state.topic,
    topic: TOPICS[state.topic]?.label || '自我反思',
    question: state.question,
    spread: state.spread,
    cards: state.selected.map((item, index) => ({
      id: item.card.id,
      name: item.card.name,
      en: item.card.en,
      image: item.card.image,
      orientation: item.orientation,
      position: positions[index]?.label || '此刻需要看见',
      deckNumber: item.deckNumber ?? null
    })),
    summary: buildOverallSummary(),
    observation: state.observation,
    reflection: state.reflection,
    nextAction: state.nextAction
  };
}

function completeSession() {
  const record = window.LifeMirrorStorage.save(getCurrentReadingSnapshot());

  setDialogue(
    `这次记录已保存在当前设备。\n\n你的问题：\n${state.question}\n\n你自己的理解：\n${state.reflection}\n\n下一步：\n${state.nextAction}`
  );

  ghost('查看完整解读', () => showFullInterpretation(0));
  ghost('生成分享卡', () => window.LifeMirrorShare?.open(record));
  primary('重新开始', reset);
}

function chooseTopic() {
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
  createDeck();

  setDialogue(
    '在心里轻轻重复你的问题，然后点击牌堆三次。\n电脑端也可以连续按三次空格键。'
  );

  primary('快速洗牌', () => {
    if (state.shuffled) return;
    const remaining = Math.max(0, 3 - state.shuffleCount);
    for (let index = 0; index < remaining; index++) {
      setTimeout(shuffleOnce, index * 170);
    }
  });
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
  renderProgress();
  renderSlots();
  clearDeck();

  setDialogue(
    '欢迎来到这张安静的桌子。\n这个版本不使用大模型，采用完整78张 Rider–Waite–Smith 塔罗牌面，并通过正逆位、问题类型、牌阵位置和组合规则生成解读。',
    [
      { label: '开始', onClick: chooseTopic },
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
    chosenNumbers: []
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
