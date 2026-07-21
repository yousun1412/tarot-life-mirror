(() => {
  let dialog, grid, search, energy, count;
  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  function render() {
    const query = search.value.trim().toLowerCase();
    const selectedEnergy = energy.value;
    const cards = (window.LIFE_MIRROR_DATA?.cards || []).filter(card => {
      const haystack = [card.name, card.en, card.theme, ...(card.energies || [])].join(' ').toLowerCase();
      return (!query || haystack.includes(query)) && (!selectedEnergy || card.energies?.includes(selectedEnergy));
    });
    count.textContent = `显示 ${cards.length} / 22 张大阿尔卡那`;
    grid.innerHTML = cards.length ? cards.map(card => `
      <button class="library-card" type="button" data-card-id="${card.id}">
        <img src="${safe(card.image)}" alt="${safe(card.name)}完整牌面" loading="lazy" decoding="async">
        <strong>${String(card.id).padStart(2,'0')} · ${safe(card.name)}</strong>
        <small>${safe(card.en)} · ${safe(card.theme)}</small>
      </button>`).join('') : '<p class="library-empty">没有找到匹配的牌。</p>';
  }
  function open() { render(); dialog.showModal(); }
  function init() {
    dialog = document.getElementById('libraryDialog');
    grid = document.getElementById('libraryGrid');
    search = document.getElementById('librarySearch');
    energy = document.getElementById('libraryEnergy');
    count = document.getElementById('libraryCount');
    if (!dialog) return;
    const energies = [...new Set((window.LIFE_MIRROR_DATA?.cards || []).flatMap(card => card.energies || []))].sort();
    energy.innerHTML = '<option value="">全部主题</option>' + energies.map(item => `<option value="${safe(item)}">${safe(item)}</option>`).join('');
    search.oninput = render; energy.onchange = render;
    grid.onclick = event => {
      const button = event.target.closest('[data-card-id]');
      if (!button) return;
      window.LifeMirrorViewer?.open(Number(button.dataset.cardId), 'upright');
    };
    document.getElementById('closeLibrary').onclick = () => dialog.close();
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }
  window.LifeMirrorLibrary = { init, open, render };
})();
