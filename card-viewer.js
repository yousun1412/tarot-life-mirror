(() => {
  let dialog, image, title, subtitle, meaning, range, currentCard, orientation = 'upright', scale = 1;
  const cardById = id => window.LIFE_MIRROR_DATA?.cards?.find(card => card.id === Number(id));

  function render() {
    if (!currentCard) return;
    const reversed = orientation === 'reversed';
    image.src = currentCard.image;
    image.alt = `${currentCard.name}${reversed ? '逆位' : '正位'}完整牌面`;
    image.style.setProperty('--viewer-rotation', reversed ? '180deg' : '0deg');
    image.style.setProperty('--viewer-scale', scale);
    title.textContent = `${currentCard.name}${reversed ? '（逆）' : ''}`;
    subtitle.textContent = `${currentCard.en} · ${reversed ? '逆位' : '正位'} · V12 高清观察`;
    const core = reversed ? currentCard.reversedCore : currentCard.uprightCore;
    const advice = reversed ? currentCard.reversedAdvice : currentCard.uprightAdvice;
    meaning.innerHTML = `<strong>${reversed ? '逆位' : '正位'}核心：</strong>${escapeHtml(core || currentCard.theme)}<br><strong>观察提示：</strong>${escapeHtml(advice || currentCard.action)}`;
    range.value = String(Math.round(scale * 100));
    document.getElementById('viewerOrientation').textContent = reversed ? '切换为正位' : '切换为逆位';
  }

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  function setScale(value) { scale = Math.min(2.4, Math.max(.65, value)); render(); }
  function open(cardOrId, requestedOrientation = 'upright') {
    currentCard = typeof cardOrId === 'object' ? cardOrId : cardById(cardOrId);
    if (!currentCard) return;
    orientation = requestedOrientation === 'reversed' ? 'reversed' : 'upright';
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
    image.addEventListener('dblclick', () => setScale(scale > 1 ? 1 : 1.7));
    image.addEventListener('wheel', event => { event.preventDefault(); setScale(scale + (event.deltaY < 0 ? .1 : -.1)); }, { passive: false });
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }

  window.LifeMirrorViewer = { init, open };
})();
