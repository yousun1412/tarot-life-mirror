/* V22 日历、周期回顾、个人统计与牌组记录。 */
(() => {
  let dialog, tabs, content;
  let activeTab = 'calendar';
  let calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12);
  let selectedDay = '';
  let reviewFilter = 'all';

  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
  const records = () => window.LifeMirrorStorage?.load() || [];
  const cards = () => window.LIFE_MIRROR_DATA?.cards || [];
  const analytics = () => window.LifeMirrorAnalytics?.summarize(records(), cards()) || {};
  const dayKey = timestamp => window.LifeMirrorAnalytics?.dayKey(timestamp) || '';
  const typeLabel = type => ({ daily: '本日运势', weekly: '本周运势', monthly: '本月运势', reflection: '问事抽牌' }[type] || '抽牌记录');
  const typeClass = type => ['daily', 'weekly', 'monthly'].includes(type) ? type : 'reflection';
  const formatDate = timestamp => new Date(timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const percentage = (value, total) => total ? Math.round(value / total * 100) : 0;
  const recordCard = record => {
    const images = (record.cards || []).slice(0, 4).map(item => {
      const card = window.LifeMirrorDecks?.resolveRawCard(item, record.deckId) || cards().find(card => Number(card.id) === Number(item.id)) || item;
      return `<img class="${item.orientation === 'reversed' ? 'reversed' : ''}" src="${safe(card.image || item.image || '')}" alt="${safe(card.name || item.name || '牌面')}">`;
    }).join('');
    const reviewed = Boolean(record.review?.updatedAt || record.review?.actual || record.review?.lesson);
    return `<article class="insight-record-card" data-record-id="${safe(record.id)}">
      <div class="insight-card-images">${images || '<span class="empty-mini">无牌面</span>'}</div>
      <div class="insight-record-copy">
        <span class="tiny-label"><b class="record-type-dot ${typeClass(record.readingType)}"></b>${safe(typeLabel(record.readingType))} · ${safe(formatDate(record.timestamp))}</span>
        <h4>${safe(record.question || record.topic || '未命名记录')}</h4>
        <p>${safe(record.summary || record.reflection || '尚未填写摘要')}</p>
        <div class="insight-record-meta"><span>${(record.cards || []).length}张牌</span><span>${safe(window.LifeMirrorDecks?.registry?.[record.deckId||'classic-rws']?.name||'经典韦特')}</span><span>${record.drawMode === 'fate' ? '交给命运' : '自选数字'}</span>${reviewed ? '<span class="reviewed-chip">已回顾</span>' : ''}</div>
      </div>
    </article>`;
  };

  function setTab(tab) {
    activeTab = tab;
    tabs.querySelectorAll('[data-insight-tab]').forEach(button => {
      const active = button.dataset.insightTab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    render();
  }

  function render() {
    if (!content) return;
    if (activeTab === 'calendar') renderCalendar();
    if (activeTab === 'review') renderReviews();
    if (activeTab === 'stats') renderStats();
  }

  function renderCalendar() {
    const list = records();
    const map = window.LifeMirrorAnalytics?.calendarMap(list) || {};
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstWeekday = new Date(year, month, 1, 12).getDay();
    const days = new Date(year, month + 1, 0, 12).getDate();
    const today = dayKey(Date.now());
    const cells = [];
    for (let index = 0; index < firstWeekday; index++) cells.push('<span class="calendar-cell calendar-empty"></span>');
    for (let day = 1; day <= days; day++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const info = map[key];
      const dots = info ? Object.keys(info.types).map(type => `<i class="calendar-dot ${typeClass(type)}" title="${safe(typeLabel(type))}"></i>`).join('') : '';
      cells.push(`<button class="calendar-cell ${key === today ? 'today' : ''} ${key === selectedDay ? 'selected' : ''} ${info ? 'has-records' : ''}" data-calendar-day="${key}"><span>${day}</span><small>${info ? `${info.total}条` : ''}</small><em>${dots}</em></button>`);
    }
    const selectedRecords = selectedDay ? list.filter(record => dayKey(record.timestamp) === selectedDay) : [];
    content.innerHTML = `<section class="calendar-panel">
      <header class="calendar-toolbar"><button data-calendar-nav="prev" aria-label="上个月">‹</button><div><h3>${year}年${month + 1}月</h3><button class="calendar-today" data-calendar-nav="today">回到今天</button></div><button data-calendar-nav="next" aria-label="下个月">›</button></header>
      <div class="calendar-weekdays"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
      <div class="calendar-grid">${cells.join('')}</div>
      <div class="calendar-legend"><span><i class="calendar-dot daily"></i>本日</span><span><i class="calendar-dot weekly"></i>本周</span><span><i class="calendar-dot monthly"></i>本月</span><span><i class="calendar-dot reflection"></i>问事</span></div>
      <section class="selected-day-panel">
        <header><div><span class="tiny-label">选中日期</span><h3>${selectedDay || '点击日期查看记录'}</h3></div><button id="calendarOpenHistory" type="button">打开完整记录</button></header>
        <div class="selected-day-records">${selectedDay ? (selectedRecords.length ? selectedRecords.map(recordCard).join('') : '<p class="history-empty-note">这一天还没有抽牌记录。</p>') : '<p class="history-empty-note">日历会显示本日、本周、本月运势和问事抽牌。</p>'}</div>
      </section>
    </section>`;
    content.querySelector('[data-calendar-nav="prev"]').onclick = () => { calendarCursor = new Date(year, month - 1, 1, 12); selectedDay = ''; renderCalendar(); };
    content.querySelector('[data-calendar-nav="next"]').onclick = () => { calendarCursor = new Date(year, month + 1, 1, 12); selectedDay = ''; renderCalendar(); };
    content.querySelector('[data-calendar-nav="today"]').onclick = () => { const now = new Date(); calendarCursor = new Date(now.getFullYear(), now.getMonth(), 1, 12); selectedDay = dayKey(now); renderCalendar(); };
    content.querySelectorAll('[data-calendar-day]').forEach(button => button.onclick = () => { selectedDay = button.dataset.calendarDay; renderCalendar(); });
    content.querySelector('#calendarOpenHistory').onclick = () => { dialog.close(); window.LifeMirrorHistory?.open(); };
    content.querySelectorAll('.insight-record-card').forEach(article => article.onclick = () => { dialog.close(); window.LifeMirrorHistory?.open(); });
  }

  function reviewFields(record) {
    const review = record.review || {};
    const prompts = record.readingType === 'daily'
      ? { actual: '今天实际发生了什么？', matched: '哪部分最符合？', missed: '哪部分没有出现或需要修正？', action: '今天采取了什么行动？', lesson: '今天真正看见了什么？', next: '明天准备调整什么？' }
      : record.readingType === 'weekly'
        ? { actual: '这一周实际发生了什么？', matched: '哪张牌或主题最明显？', missed: '哪里和原解读不同？', action: '本周使用了哪些资源或行动？', lesson: '本周最重要的学习是什么？', next: '下周准备调整什么？' }
        : { actual: '这个月实际发生了什么变化？', matched: '哪张牌或主题贯穿整月？', missed: '月初判断中哪里需要修正？', action: '本月真正落实了什么？', lesson: '本月最重要的学习是什么？', next: '下个月准备调整什么？' };
    return `<form class="review-form" data-review-form="${safe(record.id)}">
      <div class="review-heading"><div><span class="tiny-label">${safe(typeLabel(record.readingType))} · ${safe(record.periodLabel || formatDate(record.timestamp))}</span><h3>${safe(record.question || record.topic)}</h3></div><span class="review-state ${review.updatedAt ? 'done' : ''}">${review.updatedAt ? '已回顾' : '待回顾'}</span></div>
      <div class="review-source"><p><strong>当时的理解：</strong>${safe(record.reflection || '未填写')}</p><p><strong>原定行动：</strong>${safe(record.nextAction || '未填写')}</p></div>
      <label>${safe(prompts.actual)}<textarea name="actual">${safe(review.actual || '')}</textarea></label>
      <div class="review-two"><label>${safe(prompts.matched)}<textarea name="matched">${safe(review.matched || '')}</textarea></label><label>${safe(prompts.missed)}<textarea name="missed">${safe(review.missed || '')}</textarea></label></div>
      <label>${safe(prompts.action)}<textarea name="actionTaken">${safe(review.actionTaken || '')}</textarea></label>
      <div class="review-two"><label>${safe(prompts.lesson)}<textarea name="lesson">${safe(review.lesson || '')}</textarea></label><label>${safe(prompts.next)}<textarea name="nextAdjustment">${safe(review.nextAdjustment || '')}</textarea></label></div>
      <fieldset class="review-rating"><legend>这次牌阵对回顾现实的帮助程度</legend>${[1,2,3,4,5].map(value => `<label><input type="radio" name="rating" value="${value}" ${Number(review.rating) === value ? 'checked' : ''}><span>${value}</span></label>`).join('')}<small>1 = 较少帮助，5 = 很有帮助</small></fieldset>
      <div class="review-actions"><button class="primary" type="submit">保存周期回顾</button>${review.updatedAt ? '<button type="button" data-clear-review>清除回顾</button>' : ''}</div>
    </form>`;
  }

  function renderReviews() {
    const cycles = records().filter(record => ['daily', 'weekly', 'monthly'].includes(record.readingType));
    const filtered = reviewFilter === 'all' ? cycles : cycles.filter(record => record.readingType === reviewFilter);
    content.innerHTML = `<section class="reviews-panel">
      <header class="review-toolbar"><div><h3>周期回顾</h3><p>把当时的牌阵与后来真实发生的事情放在一起看。</p></div><select id="reviewFilter"><option value="all">全部周期</option><option value="daily">本日运势</option><option value="weekly">本周运势</option><option value="monthly">本月运势</option></select></header>
      <div class="review-summary-row"><span>共 ${cycles.length} 次周期运势</span><span>已回顾 ${cycles.filter(record => record.review?.updatedAt).length} 次</span></div>
      <div class="review-list">${filtered.length ? filtered.map(reviewFields).join('') : '<p class="history-empty-note">当前还没有可回顾的周期运势。</p>'}</div>
    </section>`;
    const select = content.querySelector('#reviewFilter'); select.value = reviewFilter; select.onchange = () => { reviewFilter = select.value; renderReviews(); };
    content.querySelectorAll('[data-review-form]').forEach(form => {
      form.onsubmit = event => {
        event.preventDefault();
        const data = new FormData(form);
        const review = {
          actual: String(data.get('actual') || '').trim(),
          matched: String(data.get('matched') || '').trim(),
          missed: String(data.get('missed') || '').trim(),
          actionTaken: String(data.get('actionTaken') || '').trim(),
          lesson: String(data.get('lesson') || '').trim(),
          nextAdjustment: String(data.get('nextAdjustment') || '').trim(),
          rating: Number(data.get('rating') || 0),
          updatedAt: new Date().toISOString()
        };
        if (![review.actual, review.matched, review.missed, review.actionTaken, review.lesson, review.nextAdjustment].some(Boolean)) {
          window.LifeMirrorApp?.showToast('至少写下一点真实回顾');
          return;
        }
        window.LifeMirrorStorage.update(form.dataset.reviewForm, { review });
        window.LifeMirrorApp?.showToast('周期回顾已保存');
        renderReviews();
      };
      const clear = form.querySelector('[data-clear-review]');
      if (clear) clear.onclick = () => {
        if (!confirm('清除这次周期回顾吗？原抽牌记录会保留。')) return;
        window.LifeMirrorStorage.update(form.dataset.reviewForm, { review: {} });
        renderReviews();
      };
    });
  }

  function barRows(items, total, limit = 8, labels = {}) {
    const visible = (items || []).slice(0, limit);
    if (!visible.length) return '<p class="history-empty-note">还没有足够的数据。</p>';
    const max = Math.max(...visible.map(item => item.count), 1);
    return visible.map(item => `<div class="stat-bar-row"><span>${safe(labels[item.key] || item.key)}</span><div><i style="width:${Math.max(5, item.count / max * 100)}%"></i></div><strong>${item.count}<small>${total ? ` · ${percentage(item.count, total)}%` : ''}</small></strong></div>`).join('');
  }

  function renderStats() {
    const stats = analytics();
    const typeLabels = { daily: '本日运势', weekly: '本周运势', monthly: '本月运势', reflection: '问事抽牌' };
    const spreadLabels = { single: '单牌', three: '三张牌', 'daily-single': '本日单牌', 'daily-three': '本日三牌', 'weekly-three': '本周三牌', 'weekly-seven': '本周七牌', 'monthly-five': '本月五牌', 'monthly-seven': '本月七牌', 'obstacle-four': '阻力资源', 'relationship-five': '关系模式', 'choice-six': '两个选择', 'celtic-ten': '凯尔特十字' };
    content.innerHTML = `<section class="stats-panel">
      <header class="stats-heading"><div><h3>个人模式分析</h3><p>统计只根据当前设备上的本地记录生成，不代表固定命运。</p></div><button id="statsOpenHistory" type="button">查看记录列表</button></header>
      <div class="stat-kpis"><article><strong>${stats.totalReadings || 0}</strong><span>全部抽牌</span><small>共 ${(stats.totalCards || 0)} 张牌</small></article><article><strong>${stats.thisMonth || 0}</strong><span>本月记录</span><small>近30天 ${stats.last30Days || 0} 次</small></article><article><strong>${stats.reviewed || 0}</strong><span>已完成回顾</span><small>回顾率 ${Math.round((stats.reviewRate || 0) * 100)}%</small></article><article><strong>${stats.favorites || 0}</strong><span>收藏记录</span><small>${stats.averageRating ? `平均帮助 ${stats.averageRating.toFixed(1)}/5` : '尚无评分'}</small></article></div>
      ${stats.totalReadings < 5 ? '<p class="stats-caution">记录少于5次时，统计更适合作为浏览提示，不适合下结论。</p>' : ''}
      <div class="stats-grid">
        <section><h4>最常出现的牌</h4>${barRows(stats.cards, stats.totalCards, 8)}</section>
        <section><h4>花色与大阿尔卡那</h4>${barRows(stats.suits, stats.totalCards, 6)}</section>
        <section><h4>正位与逆位</h4>${barRows(stats.orientations, stats.totalCards, 4)}</section>
        <section><h4>记录类型</h4>${barRows(stats.readingTypes, stats.totalReadings, 6, typeLabels)}</section>
        <section><h4>常用牌阵</h4>${barRows(stats.spreads, stats.totalReadings, 8, spreadLabels)}</section>
        <section><h4>常见问题领域</h4>${barRows(stats.topics, stats.totalReadings, 8)}</section>
      </div>
      <section class="pattern-note"><h4>怎样使用这些统计</h4><p>重复出现的牌和花色可以帮助你回看自己长期关注的主题，但它们不会证明某种结果必然发生。最有价值的部分，是把统计与周期回顾中的真实事件、行动和修正放在一起看。</p></section>
    </section>`;
    content.querySelector('#statsOpenHistory').onclick = () => { dialog.close(); window.LifeMirrorHistory?.open(); };
  }

  function open(tab = 'calendar') {
    if (!dialog) return;
    setTab(tab);
    dialog.showModal();
  }

  function init() {
    dialog = document.getElementById('insightsDialog');
    tabs = document.getElementById('insightTabs');
    content = document.getElementById('insightContent');
    if (!dialog || !tabs || !content) return;
    tabs.onclick = event => {
      const button = event.target.closest('[data-insight-tab]');
      if (button) setTab(button.dataset.insightTab);
    };
    document.getElementById('closeInsights').onclick = () => dialog.close();
    document.getElementById('insightsOpenHistory').onclick = () => { dialog.close(); window.LifeMirrorHistory?.open(); };
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    window.addEventListener('life-mirror-history-change', () => { if (dialog.open) render(); });
  }

  window.LifeMirrorInsights = { init, open, render };
})();
