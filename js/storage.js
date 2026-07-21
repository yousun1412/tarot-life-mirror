(() => {
  const KEY = 'lifeMirrorTarotHistory';
  const MAX_RECORDS = 100;

  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const resolveCard = raw => {
    const cards = window.LIFE_MIRROR_DATA?.cards || [];
    return cards.find(card => card.id === raw?.id) || cards.find(card => card.name === raw?.name) || null;
  };

  function normalizeRecord(record = {}) {
    const timestamp = record.timestamp || (record.date ? Date.parse(record.date) : Date.now()) || Date.now();
    return {
      id: record.id || uid(),
      timestamp,
      date: record.date || new Date(timestamp).toLocaleString(),
      readingType: record.readingType || (record.topicKey === 'daily' ? 'daily' : record.topicKey === 'weekly' ? 'weekly' : record.topicKey === 'monthly' ? 'monthly' : 'reflection'),
      dayKey: record.dayKey || '',
      weekKey: record.weekKey || '',
      monthKey: record.monthKey || '',
      periodLabel: record.periodLabel || '',
      dailyMode: record.dailyMode || '',
      weeklyMode: record.weeklyMode || '',
      monthlyMode: record.monthlyMode || '',
      topicKey: record.topicKey || '',
      topic: record.topic || '未分类',
      question: record.question || '未记录问题',
      spread: record.spread || 'single',
      drawMode: record.drawMode === 'fate' ? 'fate' : 'manual',
      cards: Array.isArray(record.cards) ? record.cards.map((item, index) => {
        const card = resolveCard(item);
        return {
          id: card?.id ?? item.id ?? null,
          name: card?.name || item.name || '未知牌',
          en: card?.en || item.en || '',
          image: card?.image || item.image || '',
          orientation: item.orientation === 'reversed' ? 'reversed' : 'upright',
          position: item.position || (
            record.spread === 'daily-three'
              ? ['今日主线','今日需要留意','今日行动建议'][index]
              : record.spread === 'weekly-three'
                ? ['本周整体主线','本周主要挑战','本周可用力量'][index]
                : record.spread === 'weekly-seven'
                  ? ['本周整体能量','学习与工作','关系与互动','情绪与内在','现实资源','主要挑战','本周建议'][index]
                  : record.spread === 'monthly-five'
                    ? ['本月整体主题','学习与工作','关系与互动','现实生活与资源','本月行动建议'][index]
                    : record.spread === 'monthly-seven'
                      ? ['月初状态','月中变化','月末趋势','学习与工作','关系与互动','主要挑战','可使用的力量'][index]
                  : record.spread === 'three'
                    ? ['当前状态','需要看见','可以行动'][index]
                    : record.spread === 'daily-single' ? '今日主题' : '此刻需要看见'
          ),
          deckNumber: Number.isInteger(Number(item.deckNumber)) ? Number(item.deckNumber) : null,
          drawMode: item.drawMode === 'fate' ? 'fate' : (record.drawMode === 'fate' ? 'fate' : 'manual')
        };
      }) : [],
      summary: record.summary || '',
      observation: record.observation || null,
      reflection: record.reflection || '',
      nextAction: record.nextAction || '',
      followUp: record.followUp || '',
      favorite: Boolean(record.favorite)
    };
  }

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeRecord).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.warn('History load failed:', error);
      return [];
    }
  }

  function write(records) {
    try {
      localStorage.setItem(KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
    } catch (error) {
      console.warn('History write failed:', error);
    }
    window.dispatchEvent(new CustomEvent('life-mirror-history-change'));
  }

  function save(record) {
    const records = load();
    const normalized = normalizeRecord(record);
    const index = records.findIndex(item => item.id === normalized.id);
    if (index >= 0) records[index] = normalized; else records.unshift(normalized);
    write(records);
    return normalized;
  }

  function remove(id) { write(load().filter(item => item.id !== id)); }
  function clear() { try { localStorage.removeItem(KEY); } catch (error) { console.warn('History clear failed:', error); } window.dispatchEvent(new CustomEvent('life-mirror-history-change')); }
  function update(id, patch) {
    const records = load();
    const index = records.findIndex(item => item.id === id);
    if (index < 0) return null;
    records[index] = normalizeRecord({ ...records[index], ...patch, id });
    write(records);
    return records[index];
  }
  function toggleFavorite(id) {
    const item = load().find(record => record.id === id);
    return item ? update(id, { favorite: !item.favorite }) : null;
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ version: 18, exportedAt: new Date().toISOString(), records: load() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `生命之镜塔罗记录-${new Date().toISOString().slice(0,10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  async function importData(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incoming = Array.isArray(parsed) ? parsed : parsed.records;
    if (!Array.isArray(incoming)) throw new Error('文件中没有有效记录');
    const map = new Map(load().map(record => [record.id, record]));
    incoming.map(normalizeRecord).forEach(record => map.set(record.id, record));
    write([...map.values()].sort((a,b) => b.timestamp-a.timestamp));
    return incoming.length;
  }

  window.LifeMirrorStorage = { load, save, remove, clear, update, toggleFavorite, exportData, importData, normalizeRecord };
})();
