(() => {
  let dialog, grid, currentLine, scanState;
  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const cards = () => window.LIFE_MIRROR_DATA?.cards || [];

  function statusCopy(deck, status) {
    if (deck.status === 'planned') return '未来扩展接口已预留';
    if (status?.scanning) return '正在检测本地牌面……';
    if (deck.builtIn) return '完整78张 · 已内置';
    if (!status || status.state === 'unknown') return `等待检测 · 计划 ${deck.coverage.major + deck.coverage.minor}/78张`;
    if (!status.total) return '尚未放入图片 · 当前使用经典牌面回退';
    if (status.total < 78) return `已检测 ${status.total}/78张 · 缺图自动回退经典牌面`;
    return '完整78张 · 已就绪';
  }

  function cover(deck, status) {
    const major = cards()[0];
    if (deck.builtIn) return `<img src="${safe(window.LifeMirrorDecks.getCardImage(major, deck.id))}" alt="${safe(deck.name)}牌组封面">`;
    if (status?.major > 0) return `<img src="${safe(window.LifeMirrorDecks.pathFor(major, deck.id))}" alt="${safe(deck.name)}牌组封面">`;
    return `<div class="deck-cover-placeholder ${safe(deck.accent || '')}"><span>✦</span><strong>${safe(deck.englishName)}</strong><small>${deck.status === 'planned' ? 'COMING SOON' : '等待上传牌面'}</small></div>`;
  }

  function render() {
    if (!grid) return;
    const current = window.LifeMirrorDecks.currentId;
    const registry = window.LifeMirrorDecks.registry;
    const currentDeck = registry[current];
    currentLine.innerHTML = `当前默认牌组：<strong>${safe(currentDeck?.name || current)}</strong><span>新抽牌将使用此牌组；历史记录保留当时牌组。</span>`;
    grid.innerHTML = Object.values(registry).map(deck => {
      const status = window.LifeMirrorDecks.getDeckStatus(deck.id);
      const selected = current === deck.id;
      const planned = deck.status === 'planned';
      return `<article class="deck-option ${selected ? 'selected' : ''} ${planned ? 'planned' : ''}" data-deck-card="${safe(deck.id)}">
        <div class="deck-option-cover">${cover(deck, status)}${selected ? '<span class="deck-selected-mark">当前</span>' : ''}</div>
        <div class="deck-option-copy">
          <span class="tiny-label">${safe(deck.englishName)} · v${safe(deck.version)}</span>
          <h3>${safe(deck.name)}</h3>
          <p>${safe(deck.description)}</p>
          <div class="deck-tags">${(deck.tags || []).map(tag => `<span>${safe(tag)}</span>`).join('')}</div>
          <strong class="deck-status ${status?.state || ''}">${safe(statusCopy(deck, status))}</strong>
          <div class="deck-option-actions">
            ${planned ? '<button type="button" disabled>尚未开放</button>' : `<button class="${selected ? '' : 'primary'}" type="button" data-select-deck="${safe(deck.id)}">${selected ? '正在使用' : '设为默认牌组'}</button>`}
            ${deck.id === 'life-mirror' ? '<button type="button" data-scan-deck="life-mirror">重新检测图片</button>' : ''}
          </div>
        </div>
      </article>`;
    }).join('');
    scanState.textContent = '生命之镜大阿尔卡那请放入 assets/decks/life-mirror/major/。程序会按文件名自动检测，无需修改代码。';
  }

  async function scan(deckId, force = false) {
    scanState.textContent = '正在检测牌组图片……';
    render();
    try {
      const status = await window.LifeMirrorDecks.probeDeck(deckId, { force });
      const deck = window.LifeMirrorDecks.registry[deckId];
      scanState.textContent = `${deck.name}：检测到 ${status.total}/${status.expected} 张。`;
    } catch (error) {
      scanState.textContent = error.message || '牌组检测失败';
    }
    render();
  }

  async function select(deckId) {
    const button = grid.querySelector(`[data-select-deck="${CSS.escape(deckId)}"]`);
    if (button) { button.disabled = true; button.textContent = '正在切换……'; }
    try {
      const info = await window.LifeMirrorDecks.setCurrentDeck(deckId);
      const status = info.status;
      window.LifeMirrorApp?.showToast(status?.total && status.total < 78 ? `已切换到${info.deck.name}，缺失牌面将使用经典韦特` : `已切换到${info.deck.name}`);
      render();
    } catch (error) {
      window.LifeMirrorApp?.showToast(error.message || '牌组切换失败');
      render();
    }
  }

  function open() {
    render();
    dialog.showModal();
    const status = window.LifeMirrorDecks.getDeckStatus('life-mirror');
    if (status?.state === 'unknown') scan('life-mirror');
  }

  function init() {
    dialog = document.getElementById('deckDialog');
    grid = document.getElementById('deckGrid');
    currentLine = document.getElementById('currentDeckLine');
    scanState = document.getElementById('deckScanState');
    if (!dialog) return;
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
  }

  window.LifeMirrorDeckUI = { init, open, render, scan };
})();
