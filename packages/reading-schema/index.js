/* V22 阅读记录协议。新增牌组与实际回退牌面字段。 */
(() => {
  const VERSION = 4;
  const normalizeLearningNote = (note = {}) => ({
    cardId: Number(note.cardId),
    keywords: String(note.keywords || '').slice(0, 180),
    upright: String(note.upright || '').slice(0, 1200),
    reversed: String(note.reversed || '').slice(0, 1200),
    lifeExample: String(note.lifeExample || '').slice(0, 1600),
    updatedAt: note.updatedAt || new Date().toISOString()
  });
  const normalizeReview = (review = {}) => ({
    actual: String(review.actual || '').slice(0, 2400),
    matched: String(review.matched || '').slice(0, 1800),
    missed: String(review.missed || '').slice(0, 1800),
    actionTaken: String(review.actionTaken || '').slice(0, 1800),
    lesson: String(review.lesson || '').slice(0, 1800),
    nextAdjustment: String(review.nextAdjustment || '').slice(0, 1800),
    rating: Math.max(0, Math.min(5, Number(review.rating) || 0)),
    updatedAt: review.updatedAt || ''
  });
  const normalizeReadingEnvelope = (record = {}) => ({
    schemaVersion: VERSION,
    platform: record.platform || window.LifeMirrorPlatform?.runtime || 'web',
    ...record
  });
  window.LifeMirrorReadingSchema = Object.freeze({ version: VERSION, normalizeLearningNote, normalizeReview, normalizeReadingEnvelope });
})();
