// V19 解读引擎 2.4：增加智能牌阵推荐与四类问事牌阵。
(() => {
  const TOPIC_LABELS = {
    relationship: '关系',
    work: '学习与工作',
    growth: '个人成长',
    emotion: '情绪状态',
    decision: '现实决定',
    daily: '本日运势',
    weekly: '本周运势',
    monthly: '本月运势'
  };

  const TOPIC_GUIDES = {
    relationship: {
      upright: card => `在关系问题里，${card.name}正位把重点放在“${card.theme}”。${card.topics.relationship} 目前更值得使用的力量是：${card.resource}`,
      reversed: card => `在关系问题里，${card.name}逆位提示“${card.theme}”可能出现受阻、过度或表达失衡。${card.topics.relationship} 需要特别核对：${card.reversedCore}。不要把牌面当成对第三方内心的证明。`
    },
    work: {
      upright: card => `放在学习与工作中，${card.name}正位说明“${card.theme}”正在成为可用条件。${card.topics.work} 可以从这一步开始落实：${card.uprightAdvice}`,
      reversed: card => `放在学习与工作中，${card.name}逆位指出执行链条中的失衡。${card.topics.work} 当前不宜只靠加大投入，先处理：${card.reversedAdvice}`
    },
    growth: {
      upright: card => `在个人成长层面，${card.name}正位邀请你主动发展“${card.theme}”。${card.topics.growth} 这不是要求完美，而是把已有资源变成稳定选择：${card.resource}`,
      reversed: card => `在个人成长层面，${card.name}逆位更像一个调整信号。${card.topics.growth} 旧模式可能通过“${card.shadow}”继续运作，适合先承认，再逐步修正。`
    },
    emotion: {
      upright: card => `在情绪问题里，${card.name}正位提示先允许“${card.theme}”被感受到。${card.topics.emotion} 情绪被命名后，再决定是否行动会更稳妥。`,
      reversed: card => `在情绪问题里，${card.name}逆位说明感受可能被压住、放大或与旧经验叠加。${card.topics.emotion} 此刻先区分身体反应、想象与可验证事实。`
    },
    decision: {
      upright: card => `面对现实决定，${card.name}正位提供的判断标准是“${card.theme}”。${card.topics.decision} 可执行的下一步是：${card.uprightAdvice}`,
      reversed: card => `面对现实决定，${card.name}逆位提醒你不要在失衡状态下仓促定案。${card.topics.decision} 先修正这个条件：${card.reversedAdvice}`
    },
    daily: {
      upright: card => `作为今天的提示，${card.name}正位让“${card.theme}”更容易被看见和使用。今天可以主动借用这股力量：${card.resource} 最先能落实的是：${card.uprightAdvice}`,
      reversed: card => `作为今天的提示，${card.name}逆位表示“${card.theme}”可能以受阻、过度、内化或不足的方式出现。今天尤其需要留意：${card.shadow} 可以先做这项调整：${card.reversedAdvice}`
    },
    weekly: {
      upright: card => `作为本周的提示，${card.name}正位让“${card.theme}”成为可以持续使用的力量。本周可主动依靠：${card.resource} 适合安排进日程的行动是：${card.uprightAdvice}`,
      reversed: card => `作为本周的提示，${card.name}逆位说明“${card.theme}”可能在一周内反复以受阻、过度、内化或不足的方式出现。本周需要管理：${card.shadow} 可先做这项调整：${card.reversedAdvice}`
    },
    monthly: {
      upright: card => `作为本月的提示，${card.name}正位让“${card.theme}”成为可以持续培养的力量。本月可主动依靠：${card.resource} 适合分阶段落实：${card.uprightAdvice}`,
      reversed: card => `作为本月的提示，${card.name}逆位说明“${card.theme}”可能在一个月内以受阻、过度、内化或不足的方式反复出现。本月需要管理：${card.shadow} 可先做这项调整：${card.reversedAdvice}`
    }
  };

  const POSITION_BUILDERS = {
    '核心视角': (card, reversed, topicText) => reversed
      ? `作为本次问题的核心调整点，${card.name}逆位要求先看见“${card.shadow}”。${topicText}`
      : `作为本次问题的核心视角，${card.name}正位建议从“${card.resource}”开始理解。${topicText}`,
    '现状': (card, reversed, topicText) => reversed
      ? `作为“当前状态”，${card.name}逆位说明问题并不是完全缺少这股能量，而是它正在以不稳定方式运行：${card.reversedCore}。${topicText}`
      : `作为“当前状态”，${card.name}正位表示这股力量已经进入现实：${card.uprightCore}。${topicText}`,
    '盲点': (card, reversed, topicText) => reversed
      ? `作为“需要看见”，${card.name}逆位指出容易被忽略的阻塞点：${card.shadow}。${topicText}`
      : `作为“需要看见”，${card.name}正位指出一个已经存在却可能被低估的资源：${card.resource}。${topicText}`,
    '行动': (card, reversed, topicText) => reversed
      ? `作为“可以行动”，先不要直接追求这张牌的理想状态。${card.reversedAdvice} 完成修正后，再决定是否推进。`
      : `作为“可以行动”，${card.name}正位可以被落实为：${card.uprightAdvice} 让行动保持具体、可观察和可调整。`,
    '阻力': (card, reversed, topicText) => reversed
      ? `作为“主要阻力”，${card.name}逆位直接暴露了失衡模式：${card.reversedCore}。${topicText}`
      : `作为“主要阻力”，${card.name}正位可能意味着这股力量被使用得过度或过于单一，需要同时检查它的阴影：${card.shadow}`,
    '资源': (card, reversed, topicText) => reversed
      ? `作为“已有资源”，${card.name}逆位表示资源尚未稳定可用。可以先从这项修正开始：${card.reversedAdvice}`
      : `作为“已有资源”，${card.name}正位说明你已经拥有：${card.resource}。${topicText}`,
    '趋势': (card, reversed, topicText) => reversed
      ? `作为“发展趋势”，${card.name}逆位提示：若现有失衡持续，${card.reversedCore}。趋势可以因新的行动而改变。`
      : `作为“发展趋势”，${card.name}正位说明：在当前条件延续时，${card.uprightCore}。这不是不可改变的预言。`,
    '代价': (card, reversed, topicText) => reversed
      ? `作为“需要承担的代价”，${card.name}逆位提醒隐藏成本可能来自：${card.shadow}。先确认是否愿意承担，再做选择。`
      : `作为“需要承担的代价”，${card.name}正位说明这条路径会要求你投入或放下：${card.uprightCore}。代价并非惩罚，而是现实交换。`,
    '判断': (card, reversed, topicText) => reversed
      ? `作为“判断标准”，${card.name}逆位要求先排除失衡判断：${card.reversedAdvice} 再比较两个选择。`
      : `作为“判断标准”，${card.name}正位建议以“${card.theme}”作为衡量依据，并核对：${card.uprightAdvice}`,
    '根基': (card, reversed, topicText) => reversed
      ? `作为“深层根基”，${card.name}逆位指出问题可能被旧模式支撑：${card.shadow}。理解根基有助于停止重复。`
      : `作为“深层根基”，${card.name}正位指出当前局面建立在：${card.resource}。这是理解问题来源的重要线索。`,
    '影响': (card, reversed, topicText) => reversed
      ? `作为“影响因素”，${card.name}逆位说明这股力量正在以受阻或失衡方式介入：${card.reversedCore}`
      : `作为“影响因素”，${card.name}正位说明这股力量正在现实中发挥作用：${card.uprightCore}`,
    '环境': (card, reversed, topicText) => reversed
      ? `作为“环境影响”，${card.name}逆位提示外部条件可能不稳定、信息不完整或支持不足。${card.reversedAdvice}`
      : `作为“环境影响”，${card.name}正位指出周围可观察到的条件与支持：${card.resource}`,
    '希望与担忧': (card, reversed, topicText) => reversed
      ? `作为“希望与担忧”，${card.name}逆位显示期待与恐惧可能纠缠在一起：${card.shadow}。先区分愿望、事实和最坏想象。`
      : `作为“希望与担忧”，${card.name}正位呈现你真正重视或期待的方向：${card.theme}。同时检查期待是否符合现实。`
  };

  const SUIT_RELATIONS = {
    'c-p': '感受需要现实安全感承载，现实安排也要照顾真实需要。',
    'c-s': '感受与判断正在相互校正；不要只靠情绪，也不要只靠分析。',
    'c-w': '情感回应正在影响行动动力，先确认真正想投入的方向。',
    'p-s': '事实判断需要落到资源、时间和身体条件上。',
    'p-w': '愿景能否实现，取决于节奏、资源和持续执行。',
    's-w': '思想需要转化为行动，但行动前应先确认目标和风险。'
  };

  const SUIT_NAMES = { s: '宝剑', w: '权杖', c: '圣杯', p: '星币' };
  const SUIT_THEMES = {
    s: '思想、沟通与事实', w: '行动、创造与意愿', c: '感受、关系与直觉', p: '资源、身体与长期建设'
  };
  const COURT_ROLES = { 11: '学习者与消息', 12: '推动者与追求', 13: '内在掌握与承载', 14: '外在掌握与管理' };

  const getTopicText = (card, topic, orientation) => {
    const guide = TOPIC_GUIDES[topic] || TOPIC_GUIDES.growth;
    return guide[orientation === 'reversed' ? 'reversed' : 'upright'](card);
  };

  const getPositionText = (card, topic, orientation, role) => {
    const reversed = orientation === 'reversed';
    const topicText = getTopicText(card, topic, orientation);
    const builder = POSITION_BUILDERS[role] || POSITION_BUILDERS['核心视角'];
    return builder(card, reversed, topicText);
  };

  const getCardAnswer = (selection, position, topic, question, binary) => {
    const { card, orientation } = selection;
    const orientationLine = orientation === 'reversed'
      ? `逆位并不等于坏结果，它指出“${card.theme}”目前更可能受阻、内化、过度或不足。`
      : `正位说明“${card.theme}”目前相对容易被辨认和使用，但仍要留意它的阴影。`;
    const binaryLine = binary
      ? '这张牌不替你给出简单的“是”或“否”，而是说明影响结果的条件。'
      : '';
    return [binaryLine, getPositionText(card, topic, orientation, position.role), orientationLine].filter(Boolean).join('\n\n');
  };

  const getSequenceInsight = selected => {
    const minors = selected.filter(item => item.card.arcana === 'minor');
    if (minors.length < 2) return null;
    const ranks = minors.map(item => Number(item.card.rank));
    if (ranks.length === 3 && ranks[1] === ranks[0] + 1 && ranks[2] === ranks[1] + 1) {
      return `数字从${ranks[0]}递增到${ranks[2]}：局面呈现逐步展开的过程，后面的牌比前面的牌更接近需要落实的阶段。`;
    }
    if (ranks.length === 3 && ranks[1] === ranks[0] - 1 && ranks[2] === ranks[1] - 1) {
      return `数字从${ranks[0]}递减到${ranks[2]}：牌阵像是在做减法，重点是收缩、释放或回到更基础的问题。`;
    }
    const same = ranks.find(rank => ranks.filter(value => value === rank).length >= 2);
    if (same) return `相同数字${same}重复出现：同一发展阶段正在不同生活领域中同步发生，适合比较它们的共同结构。`;
    return null;
  };

  const getSuitInteraction = selected => {
    const suits = [...new Set(selected.map(item => item.card.suit).filter(Boolean))].sort();
    if (suits.length !== 2) return null;
    const key = suits.join('-');
    return SUIT_RELATIONS[key] ? `花色互动｜${SUIT_NAMES[suits[0]]}＋${SUIT_NAMES[suits[1]]}：${SUIT_RELATIONS[key]}` : null;
  };

  const getCourtInsight = selected => {
    const courts = selected.filter(item => item.card.arcana === 'minor' && Number(item.card.rank) >= 11);
    if (!courts.length) return null;
    if (courts.length === 1) {
      const card = courts[0].card;
      return `宫廷牌出现｜${card.name}强调“${COURT_ROLES[card.rank]}”。它也可能代表你需要采用的一种角色，而不一定指某个具体人物。`;
    }
    return `${courts.length}张宫廷牌同时出现：问题与角色、表达方式和人与人之间的责任分配密切相关。`;
  };

  const getMajorAnchor = selected => {
    const majors = selected.filter(item => item.card.arcana === 'major');
    const minors = selected.filter(item => item.card.arcana === 'minor');
    if (majors.length === 1 && minors.length >= 1) {
      return `主次结构｜${majors[0].card.name}提供较深的人生主题，小阿尔卡那则说明它如何落实到日常的${[...new Set(minors.map(item => SUIT_THEMES[item.card.suit]))].join('、')}。`;
    }
    return null;
  };

  const getNarrativeLinks = (selected, positions, topic) => {
    if (selected.length < 2) return [];
    const links = [];
    for (let i = 0; i < selected.length - 1; i++) {
      const from = selected[i], to = selected[i + 1];
      const fromData = from.orientation === 'reversed' ? from.card.reversedCore : from.card.uprightCore;
      const toData = to.orientation === 'reversed' ? to.card.reversedAdvice : to.card.uprightAdvice;
      const transition = from.orientation === 'reversed' && to.orientation === 'upright'
        ? '从阻塞走向可用'
        : from.orientation === 'upright' && to.orientation === 'reversed'
          ? '从理解走向需要修正的执行'
          : from.orientation === 'reversed' && to.orientation === 'reversed'
            ? '两处失衡相互影响'
            : '能量继续展开';
      links.push(`${positions[i]?.label || `第${i + 1}张`} → ${positions[i + 1]?.label || `第${i + 2}张`}（${transition}）：${from.card.name}先说明“${fromData}”，${to.card.name}则要求下一步“${toData}”。`);
    }
    return links;
  };

  const getExtraPatterns = selected => [
    getSequenceInsight(selected),
    getSuitInteraction(selected),
    getCourtInsight(selected),
    getMajorAnchor(selected)
  ].filter(Boolean);

  const buildSingleSummary = ({ selection, position, topic, question, binary }) => {
    const card = selection.card;
    const orientation = selection.orientation === 'reversed' ? '逆位' : '正位';
    return [
      `关于“${question}”，${card.name}${orientation}把焦点放在“${card.theme}”。`,
      getCardAnswer(selection, position, topic, question, binary),
      `可以先验证的一步：${selection.orientation === 'reversed' ? card.reversedAdvice : card.uprightAdvice}`
    ].join('\n\n');
  };

  const buildThreeSummary = ({ selected, positions, topic, question, binary, topicNote }) => {
    const intro = topic === 'daily'
      ? `关于今天，三张牌形成“${positions.map(position => position.label).join('—')}”的发展路径。`
      : topic === 'weekly'
        ? `关于本周，三张牌形成“${positions.map(position => position.label).join('—')}”的规划路径。`
        : topic === 'monthly'
          ? `关于本月，这组牌形成“${positions.map(position => position.label).join('—')}”的月度观察路径。`
        : binary
        ? `关于“${question}”，这组三张牌不适合被压缩为简单的是或否，而是呈现影响结果的路径。`
        : `关于“${question}”，三张牌形成“${positions.map(position => position.label).join('—')}”的发展链条。`;
    const lines = selected.map((selection, index) => {
      const card = selection.card;
      const mark = selection.orientation === 'reversed' ? '逆位' : '正位';
      const core = selection.orientation === 'reversed' ? card.reversedCore : card.uprightCore;
      return `${positions[index].label}｜${card.name}${mark}：${core}`;
    });
    const links = getNarrativeLinks(selected, positions, topic);
    const action = selected[selected.length - 1];
    return [intro, ...lines, ...links, `综合方向：${topicNote}`, `最先可以落实：${action.orientation === 'reversed' ? action.card.reversedAdvice : action.card.uprightAdvice}`].join('\n\n');
  };

  const buildMultiSummary = ({ selected, positions, topic, question, topicNote, spread }) => {
    const lines = selected.map((selection, index) => {
      const card = selection.card;
      const mark = selection.orientation === 'reversed' ? '逆位' : '正位';
      const core = selection.orientation === 'reversed' ? card.reversedCore : card.uprightCore;
      return `${positions[index].label}｜${card.name}${mark}：${core}`;
    });
    const actionAt = role => {
      const index = positions.map(position => position.role).lastIndexOf(role);
      const selection = selected[index >= 0 ? index : selected.length - 1];
      return selection ? (selection.orientation === 'reversed' ? selection.card.reversedAdvice : selection.card.uprightAdvice) : '';
    };
    if (spread === 'choice-six') {
      return [
        `关于“${question}”，六张牌把两个选择放在同一套标准下比较。牌面描述当前条件、可能的发展和需要承担的现实代价，不替你做最终决定。`,
        ...lines,
        `比较时优先使用最后一张牌给出的判断标准：${actionAt('判断')}`,
        `综合方向：先比较哪条路径更符合你的价值、资源和可承受代价，而不是只比较哪一张牌看起来更好。`
      ].join('\n\n');
    }
    if (spread === 'relationship-five') {
      return [
        `关于“${question}”，五张牌用于观察双方可见状态、共同模式、阻力和你能采取的行动。牌面不证明对方未表达的真实想法。`,
        ...lines,
        `最先可以落实：${actionAt('行动')}`,
        `综合方向：把注意力放在可观察的沟通、行为和边界，而不是猜测。`
      ].join('\n\n');
    }
    if (spread === 'obstacle-four') {
      return [
        `关于“${question}”，四张牌把表面问题、深层阻力、已有资源和下一步行动放在同一条路径中。`,
        ...lines,
        `优先处理阻力后再调用资源，最先可以落实：${actionAt('行动')}`
      ].join('\n\n');
    }
    if (spread === 'celtic-ten') {
      return [
        `关于“${question}”，凯尔特十字从当前核心、根基、过去与近期发展，一直观察到自我、环境、希望担忧和综合趋势。它适合复杂问题，但仍是一张可调整的观察地图。`,
        ...lines,
        `综合趋势不是固定结局；最有价值的是辨认哪些条件可以由你的行动改变。`,
        `综合方向：${topicNote}`
      ].join('\n\n');
    }
    const intro = topic === 'monthly'
      ? `关于本月，${selected.length}张牌共同形成一张“${positions.map(position => position.label).join('—')}”的月度观察地图。`
      : topic === 'weekly'
        ? `关于本周，${selected.length}张牌共同形成一张“${positions.map(position => position.label).join('—')}”的观察地图。`
        : `关于“${question}”，${selected.length}张牌共同形成“${positions.map(position => position.label).join('—')}”的观察地图。`;
    const challengeIndex = positions.findIndex(position => position.role === '阻力');
    const challenge = selected[challengeIndex >= 0 ? challengeIndex : Math.max(0, selected.length - 2)];
    return [
      intro,
      ...lines,
      challenge ? `优先管理：${challenge.orientation === 'reversed' ? challenge.card.reversedAdvice : challenge.card.shadow}` : '',
      `最先落实：${actionAt('行动')}`,
      `综合方向：${topicNote}`
    ].filter(Boolean).join('\n\n');
  };

  const enrichCards = cards => cards.forEach(card => {
    card.v15Topics = {};
    Object.keys(TOPIC_LABELS).forEach(topic => {
      card.v15Topics[topic] = {
        upright: getTopicText(card, topic, 'upright'),
        reversed: getTopicText(card, topic, 'reversed')
      };
    });
    card.v15Positions = {};
    Object.keys(POSITION_BUILDERS).forEach(role => {
      card.v15Positions[role] = {
        upright: getPositionText(card, 'growth', 'upright', role),
        reversed: getPositionText(card, 'growth', 'reversed', role)
      };
    });
  });

  if (Array.isArray(window.TAROT_CARDS)) enrichCards(window.TAROT_CARDS);
  else if (typeof TAROT_CARDS !== 'undefined') enrichCards(TAROT_CARDS);

  window.LifeMirrorV19 = {
    version: '19.0.0',
    topicLabels: TOPIC_LABELS,
    topicText: getTopicText,
    positionText: getPositionText,
    cardAnswer: getCardAnswer,
    extraPatterns: getExtraPatterns,
    narrativeLinks: getNarrativeLinks,
    buildSingleSummary,
    buildThreeSummary,
    buildMultiSummary
  };
})();
