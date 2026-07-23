(() => {
  let dialog, grid, currentLine, scanState;
  let preReadDialog, preReadGrid, preReadDefault, preReadConfirm;
  let pendingHomeAction = '';
  let bypassHomeGate = false;
  let readingDeckLocked = false;
  let selectedPreReadDeck = '';
  let homeDeckCard;

  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const cards = () => window.LIFE_MIRROR_DATA?.cards || [];
  const deckApi = () => window.LifeMirrorDecks;
  const registry = () => deckApi()?.registry || {};
  const deckName = id => registry()[id]?.name || id || '经典韦特';
  const readingStartLabels = new Set(['本日运势', '本周运势', '本月运势', '问一件事']);

  function statusCopy(deck, status) {
    if (deck.status === 'planned') return '未来扩展接口已预留';
    if (status?.scanning) return '正在检测本地牌面……';
    if (deck.builtIn) return '完整78张 · 已内置';
    if (!status || status.state === 'unknown') return `等待检测 · 计划 ${deck.coverage.major + deck.coverage.minor}/78张`;
    if (!status.total) return '尚未放入图片 · 当前使用经典牌面回退';
    if (status.total < 78) return `已检测 ${status.total}/78张 · 缺图自动回退经典牌面`;
    return '完整78张 · 已就绪';
  }

  function compactStatus(deck, status) {
    if (!deck) return '';
    if (deck.builtIn) return '完整78张传统牌面';
    if (status?.scanning) return '正在检测艺术牌面';
    if (!status || status.state === 'unknown') return '等待检测艺术牌面';
    if (!status.total) return '暂未检测到艺术牌面，自动使用经典韦特';
    const fallback = Math.max(0, 78 - status.total);
    return fallback ? `${status.total}张艺术牌面 · ${fallback}张经典回退` : '完整78张艺术牌面';
  }

  function cover(deck, status) {
    const major = cards()[0];
    if (deck.builtIn) return `<img src="${safe(deckApi().getCardImage(major, deck.id))}" alt="${safe(deck.name)}牌组封面">`;
    if (status?.major > 0) return `<img src="${safe(deckApi().pathFor(major, deck.id))}" alt="${safe(deck.name)}牌组封面">`;
    return `<div class="deck-cover-placeholder ${safe(deck.accent || '')}"><span>✦</span><strong>${safe(deck.englishName)}</strong><small>${deck.status === 'planned' ? 'COMING SOON' : '等待上传牌面'}</small></div>`;
  }

  function render() {
    if (!grid || !deckApi()) return;
    const defaultId = deckApi().defaultId || deckApi().currentId;
    const activeId = deckApi().currentId;
    const currentDeck = registry()[defaultId];
    const sessionCopy = activeId !== defaultId
      ? `<span>本次抽牌：<strong>${safe(deckName(activeId))}</strong></span>`
      : '<span>新抽牌默认使用此牌组；历史记录保留当时牌组。</span>';
    currentLine.innerHTML = `默认牌组：<strong>${safe(currentDeck?.name || defaultId)}</strong>${sessionCopy}`;
    grid.innerHTML = Object.values(registry()).map(deck => {
      const status = deckApi().getDeckStatus(deck.id);
      const selected = defaultId === deck.id;
      const active = activeId === deck.id && activeId !== defaultId;
      const planned = deck.status === 'planned';
      return `<article class="deck-option ${selected ? 'selected' : ''} ${active ? 'session-active' : ''} ${planned ? 'planned' : ''}" data-deck-card="${safe(deck.id)}">
        <div class="deck-option-cover">${cover(deck, status)}${selected ? '<span class="deck-selected-mark">默认</span>' : active ? '<span class="deck-selected-mark session">本次</span>' : ''}</div>
        <div class="deck-option-copy">
          <span class="tiny-label">${safe(deck.englishName)} · v${safe(deck.version)}</span>
          <h3>${safe(deck.name)}</h3>
          <p>${safe(deck.description)}</p>
          <div class="deck-tags">${(deck.tags || []).map(tag => `<span>${safe(tag)}</span>`).join('')}</div>
          <strong class="deck-status ${status?.state || ''}">${safe(statusCopy(deck, status))}</strong>
          <div class="deck-option-actions">
            ${planned ? '<button type="button" disabled>尚未开放</button>' : `<button class="${selected ? '' : 'primary'}" type="button" data-select-deck="${safe(deck.id)}">${selected ? '默认牌组' : '设为默认牌组'}</button>`}
            ${deck.id === 'life-mirror' ? '<button type="button" data-scan-deck="life-mirror">重新检测图片</button>' : ''}
          </div>
        </div>
      </article>`;
    }).join('');
    scanState.textContent = '生命之镜大阿尔卡那位于 assets/decks/life-mirror/major/。缺少的小阿尔卡那会自动使用经典韦特牌面。';
    renderHomeDeckCard();
    renderPreReadOptions();
  }

  async function scan(deckId, force = false) {
    if (scanState) scanState.textContent = '正在检测牌组图片……';
    try {
      const status = await deckApi().probeDeck(deckId, { force });
      const deck = registry()[deckId];
      window.LifeMirrorApp?.showToast(`${deck.name}：检测到 ${status.total}/${status.expected} 张艺术牌面`);
    } catch (error) {
      window.LifeMirrorApp?.showToast(error.message || '牌组检测失败');
    }
    render();
  }

  async function select(deckId) {
    const button = grid.querySelector(`[data-select-deck="${CSS.escape(deckId)}"]`);
    if (button) { button.disabled = true; button.textContent = '正在切换……'; }
    try {
      const info = await deckApi().setCurrentDeck(deckId);
      const status = info.status;
      window.LifeMirrorApp?.showToast(status?.total && status.total < 78 ? `默认牌组已设为${info.deck.name}，缺失牌面将使用经典韦特` : `默认牌组已设为${info.deck.name}`);
      render();
    } catch (error) {
      window.LifeMirrorApp?.showToast(error.message || '牌组切换失败');
      render();
    }
  }

  function open() {
    if (readingDeckLocked) {
      window.LifeMirrorApp?.showToast(`本次抽牌已锁定为${deckName(deckApi().currentId)}，重新开始后可更换`);
      return;
    }
    render();
    dialog.showModal();
    const status = deckApi().getDeckStatus('life-mirror');
    if (status?.state === 'unknown') scan('life-mirror');
  }

  function ensurePreReadDialog() {
    if (document.getElementById('preReadDeckDialog')) {
      preReadDialog = document.getElementById('preReadDeckDialog');
      preReadGrid = document.getElementById('preReadDeckGrid');
      preReadDefault = document.getElementById('preReadDeckDefault');
      preReadConfirm = document.getElementById('preReadDeckConfirm');
      return;
    }
    document.body.insertAdjacentHTML('beforeend', `
      <dialog class="dialog-wide pre-read-deck-dialog" id="preReadDeckDialog">
        <header class="dialog-header">
          <div><span class="tiny-label">抽牌前确认</span><h2>本次使用哪套牌面？</h2><p class="dialog-subtitle">牌义和抽牌规则不会改变；生命之镜尚未完成的牌会自动使用经典韦特。</p></div>
          <button aria-label="关闭牌组选择" class="dialog-close" id="closePreReadDeck">×</button>
        </header>
        <div class="pre-read-deck-grid" id="preReadDeckGrid"></div>
        <label class="pre-read-default"><input id="preReadDeckDefault" type="checkbox"> 同时设为以后抽牌的默认牌组</label>
        <footer class="pre-read-actions"><button type="button" id="preReadDeckCancel">返回</button><button class="primary" type="button" id="preReadDeckConfirm">使用这套牌面继续</button></footer>
      </dialog>`);
    preReadDialog = document.getElementById('preReadDeckDialog');
    preReadGrid = document.getElementById('preReadDeckGrid');
    preReadDefault = document.getElementById('preReadDeckDefault');
    preReadConfirm = document.getElementById('preReadDeckConfirm');
    document.getElementById('closePreReadDeck').onclick = closePreRead;
    document.getElementById('preReadDeckCancel').onclick = closePreRead;
    preReadDialog.addEventListener('click', event => { if (event.target === preReadDialog) closePreRead(); });
    preReadGrid.addEventListener('click', event => {
      const option = event.target.closest('[data-pre-read-deck]');
      if (!option) return;
      selectedPreReadDeck = option.dataset.preReadDeck;
      renderPreReadOptions();
    });
    preReadConfirm.onclick = confirmPreRead;
  }

  function renderPreReadOptions() {
    if (!preReadGrid || !deckApi()) return;
    const available = Object.values(registry()).filter(deck => deck.status !== 'planned');
    preReadGrid.innerHTML = available.map(deck => {
      const status = deckApi().getDeckStatus(deck.id);
      const selected = selectedPreReadDeck === deck.id;
      return `<button type="button" class="pre-read-deck-option ${selected ? 'selected' : ''}" data-pre-read-deck="${safe(deck.id)}" aria-pressed="${selected}">
        <span class="pre-read-cover">${cover(deck, status)}</span>
        <span class="pre-read-copy"><strong>${safe(deck.name)}</strong><small>${safe(compactStatus(deck, status))}</small>${selected ? '<b>本次使用</b>' : '<b>选择</b>'}</span>
      </button>`;
    }).join('');
  }

  function openPreRead(actionLabel) {
    ensurePreReadDialog();
    pendingHomeAction = actionLabel;
    selectedPreReadDeck = deckApi().defaultId || deckApi().currentId;
    preReadDefault.checked = false;
    renderPreReadOptions();
    preReadDialog.showModal();
    const status = deckApi().getDeckStatus('life-mirror');
    if (status?.state === 'unknown') scan('life-mirror');
  }

  function closePreRead() {
    pendingHomeAction = '';
    if (preReadDialog?.open) preReadDialog.close();
  }

  function findHomeAction(label) {
    return [...document.querySelectorAll('#choices .home-tile')]
      .find(button => button.querySelector('strong')?.textContent.trim() === label);
  }

  async function confirmPreRead() {
    if (!selectedPreReadDeck || !pendingHomeAction) return;
    preReadConfirm.disabled = true;
    preReadConfirm.textContent = '正在准备牌面……';
    const actionLabel = pendingHomeAction;
    try {
      const info = preReadDefault.checked
        ? await deckApi().setCurrentDeck(selectedPreReadDeck)
        : await deckApi().setSessionDeck(selectedPreReadDeck);
      readingDeckLocked = true;
      document.documentElement.dataset.readingDeckLocked = 'true';
      closePreRead();
      render();
      setTimeout(() => {
        const action = findHomeAction(actionLabel);
        if (!action) {
          readingDeckLocked = false;
          delete document.documentElement.dataset.readingDeckLocked;
          window.LifeMirrorApp?.showToast('未能继续抽牌，请重新选择功能');
          return;
        }
        bypassHomeGate = true;
        action.click();
        bypassHomeGate = false;
        window.LifeMirrorApp?.showToast(`本次抽牌使用${info.deck.name}`);
      }, 60);
    } catch (error) {
      window.LifeMirrorApp?.showToast(error.message || '牌组准备失败');
    } finally {
      preReadConfirm.disabled = false;
      preReadConfirm.textContent = '使用这套牌面继续';
    }
  }

  function renderHomeDeckCard() {
    if (!homeDeckCard || !deckApi()) return;
    const choices = document.getElementById('choices');
    const isHome = choices?.classList.contains('home-menu');
    homeDeckCard.hidden = !isHome;
    if (!isHome) return;
    const id = deckApi().defaultId || deckApi().currentId;
    const deck = registry()[id];
    const status = deckApi().getDeckStatus(id);
    homeDeckCard.innerHTML = `<div><span class="tiny-label">当前牌面</span><strong>${safe(deck?.name || id)}</strong><small>${safe(compactStatus(deck, status))}</small></div><button type="button" id="homeDeckChange">更换牌面</button>`;
    homeDeckCard.querySelector('button').onclick = open;
    if (id === 'life-mirror' && status?.state === 'unknown') scan('life-mirror');
  }

  function installHomeDeckCard() {
    const dialogue = document.querySelector('.dialogue');
    if (!dialogue) return;
    homeDeckCard = document.createElement('section');
    homeDeckCard.id = 'homeDeckCard';
    homeDeckCard.className = 'home-deck-card';
    homeDeckCard.hidden = true;
    const message = document.getElementById('message');
    dialogue.insertBefore(homeDeckCard, message);
    const choices = document.getElementById('choices');
    const observer = new MutationObserver(renderHomeDeckCard);
    observer.observe(choices, { childList: true, attributes: true, attributeFilter: ['class'] });
    renderHomeDeckCard();
  }

  function installPreReadGate() {
    const choices = document.getElementById('choices');
    choices.addEventListener('click', event => {
      if (bypassHomeGate) return;
      const button = event.target.closest('.home-tile');
      const label = button?.querySelector('strong')?.textContent.trim();
      if (!button || !readingStartLabels.has(label)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openPreRead(label);
    }, true);

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (!readingDeckLocked) return;
      readingDeckLocked = false;
      delete document.documentElement.dataset.readingDeckLocked;
      deckApi().restoreDefaultDeck();
    }, true);
  }

  function init() {
    dialog = document.getElementById('deckDialog');
    grid = document.getElementById('deckGrid');
    currentLine = document.getElementById('currentDeckLine');
    scanState = document.getElementById('deckScanState');
    if (!dialog || !deckApi()) return;

    const deckButton = document.getElementById('deckBtn');
    deckButton.innerHTML = '<span aria-hidden="true">🎴</span><span class="deck-pill-label">牌面</span>';
    deckButton.title = '选择牌面风格';
    deckButton.setAttribute('aria-label', '选择牌面风格');

    document.getElementById('closeDeckDialog').onclick = () => dialog.close();
    grid.onclick = event => {
      const selectButton = event.target.closest('[data-select-deck]');
      if (selectButton && !selectButton.disabled) select(selectButton.dataset.selectDeck);
      const scanButton = event.target.closest('[data-scan-deck]');
      if (scanButton) scan(scanButton.dataset.scanDeck, true);
    };
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    window.addEventListener('life-mirror-deck-change', render);
    window.addEventListener('life-mirror-deck-status', render);
    ensurePreReadDialog();
    installHomeDeckCard();
    installPreReadGate();
    render();
  }

  window.LifeMirrorDeckUI = { init, open, render, scan, get readingDeckLocked() { return readingDeckLocked; } };
})();
