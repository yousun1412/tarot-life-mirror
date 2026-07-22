/* V20 阅读记录协议。不同平台共享同一种数据格式。 */
(() => {
  const VERSION = 2;
  const normalizeLearningNote = (note = {}) => ({
    cardId: Number(note.cardId),
    keywords: String(note.keywords || '').slice(0, 180),
    upright: String(note.upright || '').slice(0, 1200),
    reversed: String(note.reversed || '').slice(0, 1200),
    lifeExample: String(note.lifeExample || '').slice(0, 1600),
    updatedAt: note.updatedAt || new Date().toISOString()
  });
  const normalizeReadingEnvelope = (record = {}) => ({
    schemaVersion: VERSION,
    platform: record.platform || window.LifeMirrorPlatform?.runtime || 'web',
    ...record
  });
  window.LifeMirrorReadingSchema = Object.freeze({ version: VERSION, normalizeLearningNote, normalizeReadingEnvelope });
})();
