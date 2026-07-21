(() => {
  let dialog, list, search, filter;
  const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const cardData=raw=>window.LIFE_MIRROR_DATA?.cards?.find(card=>card.id===raw.id)||window.LIFE_MIRROR_DATA?.cards?.find(card=>card.name===raw.name)||raw;
  function snapshot(record){return {...record,cards:record.cards.map(raw=>{const card=cardData(raw);return {...raw,id:card.id,name:card.name,image:card.image};})};}
  function render(){
    const query=search.value.trim().toLowerCase(), topic=filter.value;
    const records=window.LifeMirrorStorage.load().filter(record=>{const hay=[record.question,record.topic,record.reflection,record.nextAction,...record.cards.map(c=>c.name)].join(' ').toLowerCase();return(!query||hay.includes(query))&&(!topic||record.topic===topic);});
    if(!records.length){list.innerHTML='<p class="history-empty-note">没有匹配的本地记录。</p>';return;}
    list.innerHTML=records.map(record=>{
      const cards=record.cards.map(raw=>{const card=cardData(raw);return `<button class="history-card-mini ${raw.orientation==='reversed'?'reversed':''}" data-view-card="${card.id}" data-orientation="${raw.orientation}" title="放大${safe(card.name)}"><img src="${safe(card.image)}" alt="${safe(card.name)}"><span>${safe(card.name)}${raw.orientation==='reversed'?'（逆）':''}${raw.deckNumber?` · #${raw.deckNumber}`:''}</span></button>`;}).join('');
      return `<article class="history-item ${record.favorite?'favorite':''}" data-record-id="${safe(record.id)}" data-reading-type="${safe(record.readingType||'reflection')}">
        <span class="tiny-label">${safe(record.date)} · ${safe(record.topic)} · ${record.drawMode==='fate'?'交给命运':'自选数字'}${record.readingType==='daily'?'<span class="daily-record-badge">本日运势</span>':record.readingType==='weekly'?'<span class="weekly-record-badge">本周运势</span>':record.readingType==='monthly'?'<span class="monthly-record-badge">本月运势</span>':''}</span><h3>${safe(record.question)}</h3><div class="history-card-row">${cards}</div>
        <p><strong>反思：</strong>${safe(record.reflection||'未填写')}</p><p><strong>下一步：</strong>${safe(record.nextAction||'未填写')}</p>
        <details class="history-detail"><summary>完整摘要与后续记录</summary><p>${safe(record.summary||'')}</p><textarea class="followup-box" placeholder="后来发生了什么？这次牌阵有哪些地方值得修正？">${safe(record.followUp||'')}</textarea><button data-action="save-followup">保存后续记录</button></details>
        <div class="history-item-actions"><button data-action="favorite">${record.favorite?'★ 已收藏':'☆ 收藏'}</button><button data-action="share">生成分享卡</button><button class="danger" data-action="delete">删除</button></div>
      </article>`;
    }).join('');
  }
  function open(){render();dialog.showModal();}
  function init(){
    dialog=document.getElementById('historyDialog');list=document.getElementById('historyList');search=document.getElementById('historySearch');filter=document.getElementById('historyTopicFilter');if(!dialog)return;
    search.oninput=render;filter.onchange=render;document.getElementById('closeHistory').onclick=()=>dialog.close();
    document.getElementById('exportHistory').onclick=()=>window.LifeMirrorStorage.exportData();
    document.getElementById('importHistoryFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const n=await window.LifeMirrorStorage.importData(file);render();window.LifeMirrorApp?.showToast(`已导入 ${n} 条记录`);}catch(err){window.LifeMirrorApp?.showToast(err.message||'导入失败');}e.target.value='';};
    document.getElementById('clearHistory').onclick=()=>{if(confirm('确定清除当前设备上的全部塔罗记录吗？')){window.LifeMirrorStorage.clear();render();}};
    list.onclick=e=>{
      const cardBtn=e.target.closest('[data-view-card]');if(cardBtn){window.LifeMirrorViewer?.open(Number(cardBtn.dataset.viewCard),cardBtn.dataset.orientation);return;}
      const article=e.target.closest('[data-record-id]'),button=e.target.closest('[data-action]');if(!article||!button)return;const id=article.dataset.recordId,record=window.LifeMirrorStorage.load().find(r=>r.id===id);if(!record)return;
      if(button.dataset.action==='favorite')window.LifeMirrorStorage.toggleFavorite(id);
      if(button.dataset.action==='delete'&&confirm('删除这一条记录吗？'))window.LifeMirrorStorage.remove(id);
      if(button.dataset.action==='share')window.LifeMirrorShare?.open(snapshot(record));
      if(button.dataset.action==='save-followup'){const value=article.querySelector('.followup-box').value.trim();window.LifeMirrorStorage.update(id,{followUp:value});window.LifeMirrorApp?.showToast('后续记录已保存');}
      render();
    };
    window.addEventListener('life-mirror-history-change',render);
  }
  window.LifeMirrorHistory={init,open,render};
})();
