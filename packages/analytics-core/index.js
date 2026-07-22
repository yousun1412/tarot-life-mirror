/* V21 纯记录统计核心：不操作 DOM，可复用于 Web、手机、桌面和小程序。 */
(() => {
  const dayKey = (timestamp, timeZone) => {
    const date = new Date(Number(timestamp) || Date.now());
    if (timeZone && globalThis.Intl?.DateTimeFormat) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(date);
      const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
      return `${map.year}-${map.month}-${map.day}`;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  function countBy(items, keyFn) {
    const map = new Map();
    for (const item of items || []) {
      const key = keyFn(item);
      if (key === undefined || key === null || key === '') continue;
      map.set(String(key), (map.get(String(key)) || 0) + 1);
    }
    return [...map.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key, 'zh-CN'));
  }

  function calendarMap(records, options = {}) {
    const map = {};
    for (const record of records || []) {
      const key = dayKey(record.timestamp, options.timeZone);
      map[key] ||= { total: 0, types: {}, ids: [] };
      map[key].total += 1;
      const type = record.readingType || 'reflection';
      map[key].types[type] = (map[key].types[type] || 0) + 1;
      map[key].ids.push(record.id);
    }
    return map;
  }

  function summarize(records, cards = [], now = Date.now()) {
    const list = Array.isArray(records) ? records : [];
    const cardMap = new Map((cards || []).map(card => [Number(card.id), card]));
    const flattened = list.flatMap(record => (record.cards || []).map(item => ({
      ...item,
      record,
      card: cardMap.get(Number(item.id)) || item
    })));
    const nowDate = new Date(now);
    const monthPrefix = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
    const cutoff30 = now - 30 * 86400000;
    const reviewed = list.filter(record => record.review?.updatedAt || record.review?.actual || record.review?.lesson);
    const favorite = list.filter(record => record.favorite);
    const cardCounts = countBy(flattened, item => item.card?.name || item.name || '未知牌');
    const suitCounts = countBy(flattened, item => {
      const card = item.card || {};
      if (card.arcana === 'major' || Number(card.id) < 22) return '大阿尔卡那';
      return card.suitName || ({ s: '宝剑', w: '权杖', c: '圣杯', p: '星币' }[card.suit]) || '其他';
    });
    const orientationCounts = countBy(flattened, item => item.orientation === 'reversed' ? '逆位' : '正位');
    const topicCounts = countBy(list, record => record.topic || '未分类');
    const spreadCounts = countBy(list, record => record.spread || '未知牌阵');
    const typeCounts = countBy(list, record => record.readingType || 'reflection');
    const ratingValues = reviewed.map(record => Number(record.review?.rating)).filter(value => value >= 1 && value <= 5);
    const averageRating = ratingValues.length ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length : 0;
    return {
      totalReadings: list.length,
      totalCards: flattened.length,
      thisMonth: list.filter(record => dayKey(record.timestamp).startsWith(monthPrefix)).length,
      last30Days: list.filter(record => Number(record.timestamp) >= cutoff30).length,
      reviewed: reviewed.length,
      favorites: favorite.length,
      reviewRate: list.length ? reviewed.length / list.length : 0,
      averageRating,
      cards: cardCounts,
      suits: suitCounts,
      orientations: orientationCounts,
      topics: topicCounts,
      spreads: spreadCounts,
      readingTypes: typeCounts,
      calendar: calendarMap(list)
    };
  }

  window.LifeMirrorAnalytics = Object.freeze({ version: '21.0.0', dayKey, countBy, calendarMap, summarize });
})();
