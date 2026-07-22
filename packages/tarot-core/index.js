/* V20 纯塔罗核心：不操作 DOM、不依赖存储，可复用于 Web、手机、桌面与小程序。 */
(() => {
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
  function shuffle(cards) {
    const result = [...cards];
    for (let index = result.length - 1; index > 0; index--) {
      const swapIndex = randomInt(index + 1);
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }
  function randomOrientation() { return randomInt(2) === 0 ? 'upright' : 'reversed'; }
  function chooseUniqueNumbers(total, count, excluded = []) {
    if (!Number.isInteger(total) || !Number.isInteger(count) || count < 0 || count > total) throw new RangeError('invalid draw range');
    const blocked = new Set(excluded.map(Number));
    const available = Array.from({ length: total }, (_, index) => index + 1).filter(value => !blocked.has(value));
    if (count > available.length) throw new RangeError('not enough available cards');
    return shuffle(available).slice(0, count);
  }
  function drawByNumbers(deck, numbers, orientations) {
    const used = new Set();
    return numbers.map((number, index) => {
      const value = Number(number);
      if (!Number.isInteger(value) || value < 1 || value > deck.length || used.has(value)) throw new RangeError(`invalid card number: ${number}`);
      used.add(value);
      return { card: deck[value - 1], deckNumber: value, orientation: orientations?.[index] || randomOrientation() };
    });
  }
  function validateDeck(cards) {
    const errors = [];
    if (!Array.isArray(cards) || cards.length !== 78) errors.push('deck must contain 78 cards');
    const ids = new Set((cards || []).map(card => card.id));
    if (ids.size !== (cards || []).length) errors.push('card ids must be unique');
    return { valid: errors.length === 0, errors };
  }
  window.LifeMirrorTarotCore = Object.freeze({ version: '22.0.0', randomInt, shuffle, randomOrientation, chooseUniqueNumbers, drawByNumbers, validateDeck });
})();
