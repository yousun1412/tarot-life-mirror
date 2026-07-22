(() => {
  let dialog, image, title, subtitle, meaning, range, currentCard, orientation = 'upright', scale = 1, requestedDeckId = '', resolvedDeckId = '';
  const cardById = id => window.LIFE_MIRROR_DATA?.cards?.find(card => card.id === Number(id));

  function render() {
    if (!currentCard) return;
    const reversed = orientation === 'reversed';
    const presentation = window.LifeMirrorDecks?.resolveCard(currentCard, requestedDeckId || window.LifeMirrorDecks?.currentId, resolvedDeckId) || currentCard;
    resolvedDeckId = presentation.resolvedDeckId || resolvedDeckId || 'classic-rws';
    image.src = presentation.image || currentCard.image;
    image.alt = `${currentCard.name}${reversed ? '逆位' : '正位'}完整牌面`;
    image.style.setProperty('--viewer-rotation', reversed ? '180deg' : '0deg');
    image.style.setProperty('--viewer-scale', scale);
    title.textContent = `${currentCard.name}${reversed ? '（逆）' : ''}`;
    const requestedName = window.LifeMirrorDecks?.registry?.[requestedDeckId]?.name || '经典韦特';
    const resolvedName = window.LifeMirrorDecks?.registry?.[resolvedDeckId]?.name || requestedName;
    subtitle.textContent = `${currentCard.en} · ${reversed ? '逆位' : '正位'} · ${requestedName}${resolvedName !== requestedName ? `（牌面回退：${resolvedName}）` : ''}`;
    const core = reversed ? currentCard.reversedCore : currentCard.uprightCore;
    const advice = reversed ? currentCard.reversedAdvice : currentCard.uprightAdvice;
    meaning.innerHTML = `<strong>${reversed ? '逆位' : '正位'}核心：</strong>${escapeHtml(core || currentCard.theme)}<br><strong>观察提示：</strong>${escapeHtml(advice || currentCard.action)}`;
    range.value = String(Math.round(scale * 100));
    document.getElementById('viewerOrientation').textContent = reversed ? '切换为正位' : '切换为逆位';
  }

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  function setScale(value) { scale = Math.min(2.4, Math.max(.65, value)); render(); }
  function open(cardOrId, requestedOrientation = 'upright', deckId = '', preferredResolvedDeckId = '') {
    currentCard = typeof cardOrId === 'object' ? cardOrId : cardById(cardOrId);
    if (!currentCard) return;
    orientation = requestedOrientation === 'reversed' ? 'reversed' : 'upright';
    requestedDeckId = deckId || window.LifeMirrorDecks?.currentId || 'classic-rws';
    resolvedDeckId = preferredResolvedDeckId || window.LifeMirrorDecks?.getResolvedDeckId(currentCard, requestedDeckId) || 'classic-rws';
    scale = 1;
    render();
    dialog.showModal();
  }

  function init() {
    dialog = document.getElementById('cardViewerDialog');
    if (!dialog) return;
    image = document.getElementById('viewerImage');
    title = document.getElementById('viewerCardTitle');
    subtitle = document.getElementById('viewerCardSubtitle');
    meaning = document.getElementById('viewerMeaning');
    range = document.getElementById('viewerZoom');
    document.getElementById('closeCardViewer').onclick = () => dialog.close();
    document.getElementById('viewerZoomIn').onclick = () => setScale(scale + .15);
    document.getElementById('viewerZoomOut').onclick = () => setScale(scale - .15);
    document.getElementById('viewerReset').onclick = () => setScale(1);
    document.getElementById('viewerOrientation').onclick = () => { orientation = orientation === 'upright' ? 'reversed' : 'upright'; render(); };
    range.oninput = event => setScale(Number(event.target.value) / 100);
    image.onerror = async () => {
      try {
        const loaded = await window.LifeMirrorDecks?.loadCardImage(currentCard, requestedDeckId);
        if (loaded?.src && image.src !== new URL(loaded.src, location.href).href) { resolvedDeckId = loaded.deckId; image.src = loaded.src; }
      } catch { image.onerror = null; }
    };
    image.addEventListener('dblclick', () => setScale(scale > 1 ? 1 : 1.7));
    image.addEventListener('wheel', event => { event.preventDefault(); setScale(scale + (event.deltaY < 0 ? .1 : -.1)); }, { passive: false });
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }

  window.LifeMirrorViewer = { init, open };
})();
