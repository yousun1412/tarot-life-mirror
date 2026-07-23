/* V22.1 跨平台牌组核心：注册、检测、回退、默认牌组与单次抽牌牌组。 */
(() => {
  const STORAGE_KEY = 'lifeMirrorTarotDeckV22';
  const registry = window.LIFE_MIRROR_DECKS || {};
  const availability = new Map();
  const probeTasks = new Map();
  const cards = () => window.LIFE_MIRROR_DATA?.cards || [];
  const storage = () => window.LifeMirrorPlatform?.storage;
  const assetPath = src => window.LIFE_MIRROR_ASSET_MAP?.[src] || src;

  const normalizeId = id => registry[id] ? id : 'classic-rws';
  let defaultId = normalizeId(storage()?.getSync?.(STORAGE_KEY) || 'classic-rws');
  let currentId = defaultId;

  function cardKey(card) {
    if (card?.arcana === 'major') return `major:${String(Number(card.id)).padStart(2, '0')}`;
    return `minor:${String(card?.deckCode || '').toLowerCase()}`;
  }

  function pathFor(card, deckId) {
    const deck = registry[deckId];
    if (!deck?.paths) return '';
    if (card.arcana === 'major') {
      const filename = deck.majorFiles?.[Number(card.id)] || `${String(Number(card.id)).padStart(2, '0')}.${deck.formats?.major || 'webp'}`;
      return assetPath(String(deck.paths.major || '')
        .replace('{id}', String(Number(card.id)))
        .replace('{id2}', String(Number(card.id)).padStart(2, '0'))
        .replace('{filename}', filename));
    }
    const code = String(card.deckCode || '').toLowerCase();
    return assetPath(String(deck.paths.minor || '')
      .replace('{code}', code)
      .replace('{filename}', `${code}.${deck.formats?.minor || 'webp'}`));
  }

  function declaredFor(deck, card) {
    if (!deck || deck.status === 'planned') return false;
    if (card.arcana === 'major') return Number(deck.coverage?.major || 0) > Number(card.id);
    return Number(deck.coverage?.minor || 0) > 0 && Boolean(deck.paths?.minor);
  }

  function deckChain(deckId) {
    const result = [];
    const visited = new Set();
    let id = normalizeId(deckId);
    while (id && registry[id] && !visited.has(id)) {
      visited.add(id); result.push(id); id = registry[id].fallbackDeck || '';
    }
    if (!result.includes('classic-rws') && registry['classic-rws']) result.push('classic-rws');
    return result;
  }

  function isAvailable(deckId, card) {
    const deck = registry[deckId];
    if (!declaredFor(deck, card)) return false;
    if (deck.builtIn) return true;
    return availability.get(deckId)?.get(cardKey(card)) === true;
  }

  function getResolvedDeckId(card, requestedDeckId = currentId) {
    for (const id of deckChain(requestedDeckId)) if (isAvailable(id, card)) return id;
    return 'classic-rws';
  }

  function getCardImage(card, requestedDeckId = currentId) {
    if (!card) return '';
    const resolved = getResolvedDeckId(card, requestedDeckId);
    return pathFor(card, resolved) || card.classicImage || '';
  }

  function getCandidates(card, requestedDeckId = currentId) {
    const candidates = [];
    for (const id of deckChain(requestedDeckId)) {
      const deck = registry[id];
      if (!declaredFor(deck, card)) continue;
      const src = pathFor(card, id);
      if (src && !candidates.some(item => item.src === src)) candidates.push({ deckId: id, src });
    }
    if (card?.classicImage && !candidates.some(item => item.src === card.classicImage)) candidates.push({ deckId: 'classic-rws', src: card.classicImage });
    return candidates;
  }

  async function probeUrl(src) {
    try {
      let response = await fetch(src, { method: 'HEAD', cache: 'no-store' });
      if (response.status === 405 || response.status === 501) response = await fetch(src, { method: 'GET', cache: 'no-store' });
      return response.ok;
    } catch { return false; }
  }

  async function probeDeck(deckId, { force = false } = {}) {
    const id = normalizeId(deckId);
    const deck = registry[id];
    if (!deck || deck.status === 'planned') return getDeckStatus(id);
    if (deck.builtIn) return getDeckStatus(id);
    if (!force && probeTasks.has(id)) return probeTasks.get(id);

    const task = (async () => {
      const map = new Map();
      const targetCards = cards().filter(card => declaredFor(deck, card));
      let cursor = 0;
      const worker = async () => {
        while (cursor < targetCards.length) {
          const card = targetCards[cursor++];
          map.set(cardKey(card), await probeUrl(pathFor(card, id)));
        }
      };
      await Promise.all(Array.from({ length: Math.min(5, Math.max(1, targetCards.length)) }, worker));
      availability.set(id, map);
      window.dispatchEvent(new CustomEvent('life-mirror-deck-status', { detail: getDeckStatus(id) }));
      window.dispatchEvent(new CustomEvent('life-mirror-deck-change', { detail: getCurrentDeckInfo() }));
      return getDeckStatus(id);
    })().finally(() => probeTasks.delete(id));
    probeTasks.set(id, task);
    return task;
  }

  function getDeckStatus(deckId) {
    const id = normalizeId(deckId);
    const deck = registry[id];
    if (!deck) return null;
    if (deck.builtIn) return { id, state: 'ready', major: 22, minor: 56, total: 78, expected: 78, scanning: false };
    if (deck.status === 'planned') return { id, state: 'planned', major: 0, minor: 0, total: 0, expected: 78, scanning: false };
    const map = availability.get(id);
    const major = cards().filter(card => card.arcana === 'major' && map?.get(cardKey(card))).length;
    const minor = cards().filter(card => card.arcana === 'minor' && map?.get(cardKey(card))).length;
    return {
      id,
      state: probeTasks.has(id) ? 'scanning' : map ? (major + minor ? 'partial' : 'empty') : 'unknown',
      major, minor, total: major + minor,
      expected: Number(deck.coverage?.major || 0) + Number(deck.coverage?.minor || 0),
      scanning: probeTasks.has(id)
    };
  }

  function getCurrentDeckInfo() {
    return {
      id: currentId,
      defaultId,
      isSessionOverride: currentId !== defaultId,
      deck: registry[currentId],
      defaultDeck: registry[defaultId],
      status: getDeckStatus(currentId)
    };
  }

  function applyCurrentDeck(id, { persist = false } = {}) {
    currentId = normalizeId(id);
    if (persist) {
      defaultId = currentId;
      storage()?.setSync?.(STORAGE_KEY, defaultId);
    }
    document.documentElement.dataset.tarotDeck = currentId;
    document.documentElement.dataset.tarotDefaultDeck = defaultId;
    window.dispatchEvent(new CustomEvent('life-mirror-deck-change', { detail: getCurrentDeckInfo() }));
    return getCurrentDeckInfo();
  }

  async function prepareDeck(deckId) {
    const id = normalizeId(deckId);
    if (registry[id]?.status === 'planned') throw new Error('这套牌面仍在规划中');
    if (!registry[id]?.builtIn) await probeDeck(id, { force: true });
    return id;
  }

  async function setCurrentDeck(deckId) {
    const id = await prepareDeck(deckId);
    return applyCurrentDeck(id, { persist: true });
  }

  async function setSessionDeck(deckId) {
    const id = await prepareDeck(deckId);
    return applyCurrentDeck(id, { persist: false });
  }

  function restoreDefaultDeck() {
    return applyCurrentDeck(defaultId, { persist: false });
  }

  function resolveCard(card, requestedDeckId = currentId, preferredResolvedDeckId = '') {
    if (!card) return card;
    const resolvedDeckId = preferredResolvedDeckId && registry[preferredResolvedDeckId]
      ? preferredResolvedDeckId
      : getResolvedDeckId(card, requestedDeckId);
    return {
      ...card,
      image: pathFor(card, resolvedDeckId) || card.classicImage || '',
      requestedDeckId: normalizeId(requestedDeckId),
      resolvedDeckId
    };
  }

  function resolveRawCard(raw, recordDeckId = currentId) {
    const base = cards().find(card => Number(card.id) === Number(raw?.id)) || cards().find(card => card.name === raw?.name) || raw;
    return resolveCard(base, raw?.deckId || recordDeckId, raw?.resolvedDeckId || '');
  }

  function loadCardImage(card, requestedDeckId = currentId, preferredResolvedDeckId = '') {
    const preferred = preferredResolvedDeckId ? [{ deckId: preferredResolvedDeckId, src: pathFor(card, preferredResolvedDeckId) }] : [];
    const candidates = [...preferred, ...getCandidates(card, requestedDeckId)].filter((item, index, arr) => item.src && arr.findIndex(other => other.src === item.src) === index);
    return new Promise((resolve, reject) => {
      let index = 0;
      const next = () => {
        const candidate = candidates[index++];
        if (!candidate) { reject(new Error('牌面图片加载失败')); return; }
        const image = new Image();
        image.onload = () => resolve({ image, ...candidate });
        image.onerror = next;
        image.src = candidate.src;
      };
      next();
    });
  }

  function decorateCards() {
    for (const card of cards()) {
      const classic = card.classicImage || card.image || '';
      card.classicImage = classic;
      try {
        Object.defineProperty(card, 'image', {
          configurable: true,
          enumerable: true,
          get() { return getCardImage(card, currentId); },
          set(value) { card.classicImage = value; }
        });
      } catch { card.image = getCardImage(card, currentId); }
    }
  }

  document.documentElement.dataset.tarotDeck = currentId;
  document.documentElement.dataset.tarotDefaultDeck = defaultId;
  decorateCards();
  if (currentId !== 'classic-rws') setTimeout(() => probeDeck(currentId), 0);

  window.LifeMirrorDecks = Object.freeze({
    registry,
    get currentId() { return currentId; },
    get defaultId() { return defaultId; },
    cardKey, pathFor, getCardImage, getResolvedDeckId, getCandidates,
    getDeckStatus, getCurrentDeckInfo, probeDeck, setCurrentDeck, setSessionDeck, restoreDefaultDeck,
    resolveCard, resolveRawCard, loadCardImage, decorateCards
  });
})();
