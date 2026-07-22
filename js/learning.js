/* V20 学习塔罗：每日学习、看图识牌、我的牌义与本地进度。 */
(() => {
  const KEY = 'lifeMirrorLearningV20';
  let dialog, content, tabs;
  let activeTab = 'daily';
  let quiz = null;
  const cards = () => window.LIFE_MIRROR_DATA?.cards || [];
  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const store = () => window.LifeMirrorPlatform?.storage;
  const defaults = () => ({ notes: {}, studied: [], quizAttempts: 0, quizCorrect: 0, daily: {} });
  function load() {
    try { return { ...defaults(), ...JSON.parse(store()?.getSync(KEY, '{}') || '{}') }; }
    catch { return defaults(); }
  }
  function save(data) { store()?.setSync(KEY, JSON.stringify(data)); window.dispatchEvent(new CustomEvent('life-mirror-learning-change')); }
  function markStudied(cardId) { const data=load(); data.studied=[...new Set([...(data.studied||[]),Number(cardId)])]; save(data); }
  function dayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
  function hash(text){let value=2166136261;for(const char of text){value^=char.charCodeAt(0);value=Math.imul(value,16777619)}return value>>>0}
  function dailyCard(){const list=cards();return list[hash(dayKey())%list.length]}
  function cardImage(card){return `<img src="${safe(card.image)}" alt="${safe(card.name)}牌面" loading="eager" decoding="async">`}
  function renderDaily(){
    const card=dailyCard(), data=load(), current=data.daily?.[dayKey()]||{}, revealed=Boolean(current.revealed);
    content.innerHTML=`<section class="learning-daily"><div class="learning-card-stage ${revealed?'revealed':''}">${cardImage(card)}${revealed?`<div class="learning-card-name"><strong>${safe(card.name)}</strong><small>${safe(card.en)}</small></div>`:'<div class="learning-card-cover"><span>先观察画面</span><small>写下第一感觉后再揭示牌名</small></div>'}</div><div class="learning-copy"><span class="tiny-label">今日学习牌 · ${dayKey()}</span><h3>${revealed?safe(card.name):'画面先于答案'}</h3><label>第一眼注意到了什么？<textarea id="dailyLearningImpression" placeholder="颜色、人物、动作、情绪或某个象征……">${safe(current.impression||'')}</textarea></label><div class="learning-actions"><button class="primary" id="saveDailyImpression">${revealed?'保存观察':'保存并揭示牌名'}</button><button id="openDailyCard" type="button" ${revealed?'':'disabled'}>查看完整牌义</button></div>${revealed?`<div class="learning-meaning"><p><strong>核心主题：</strong>${safe(card.theme)}</p><p><strong>可使用的力量：</strong>${safe(card.resource)}</p><p><strong>需要留意：</strong>${safe(card.shadow)}</p><p><strong>画面线索：</strong>${safe(card.visual)}</p></div>`:''}</div></section>`;
    document.getElementById('saveDailyImpression').onclick=()=>{const impression=document.getElementById('dailyLearningImpression').value.trim();const next=load();next.daily={...(next.daily||{}),[dayKey()]:{cardId:card.id,impression,revealed:true,updatedAt:new Date().toISOString()}};next.studied=[...new Set([...(next.studied||[]),card.id])];save(next);renderDaily()};
    document.getElementById('openDailyCard')?.addEventListener('click',()=>window.LifeMirrorViewer?.open(card.id,'upright'));
  }
  function newQuiz(){
    const list=cards(), card=list[window.LifeMirrorTarotCore.randomInt(list.length)];
    const distractors=window.LifeMirrorTarotCore.shuffle(list.filter(item=>item.id!==card.id)).slice(0,3);
    quiz={card,options:window.LifeMirrorTarotCore.shuffle([card,...distractors]),answered:false};renderQuiz();
  }
  function renderQuiz(){
    if(!quiz){newQuiz();return}
    content.innerHTML=`<section class="learning-quiz"><header><span class="tiny-label">看图识牌</span><h3>这张牌是什么？</h3><p>先从人物、数字、花色和象征判断，再查看答案。</p></header><div class="quiz-card">${cardImage(quiz.card)}</div><div class="quiz-options">${quiz.options.map(option=>`<button data-quiz-card="${option.id}" ${quiz.answered?'disabled':''}>${safe(option.name)}<small>${safe(option.en)}</small></button>`).join('')}</div><div id="quizFeedback" class="quiz-feedback">${quiz.answered?`<strong>答案：${safe(quiz.card.name)}</strong><p>${safe(quiz.card.theme)}</p><button class="primary" id="nextQuiz">下一题</button>`:'选择一个答案'}</div></section>`;
    document.querySelectorAll('[data-quiz-card]').forEach(button=>button.onclick=()=>answerQuiz(Number(button.dataset.quizCard)));
    document.getElementById('nextQuiz')?.addEventListener('click',newQuiz);
  }
  function answerQuiz(cardId){
    if(quiz?.answered)return;quiz.answered=true;const correct=cardId===quiz.card.id;const data=load();data.quizAttempts=(data.quizAttempts||0)+1;data.quizCorrect=(data.quizCorrect||0)+(correct?1:0);data.studied=[...new Set([...(data.studied||[]),quiz.card.id])];save(data);renderQuiz();const feedback=document.getElementById('quizFeedback');feedback.classList.add(correct?'correct':'wrong');feedback.insertAdjacentHTML('afterbegin',`<span>${correct?'回答正确':'这次没有选对'}</span>`);
  }
  function renderNotes(cardId){
    const list=cards(), selected=list.find(card=>card.id===Number(cardId))||list[0], data=load(), note=data.notes?.[selected.id]||{};
    content.innerHTML=`<section class="learning-notes"><div class="learning-note-select"><label>选择一张牌<select id="learningNoteCard">${list.map(card=>`<option value="${card.id}" ${card.id===selected.id?'selected':''}>${safe(card.deckCode||card.id)} · ${safe(card.name)}</option>`).join('')}</select></label><button id="viewNoteCard">查看牌面</button></div><div class="note-card-summary">${cardImage(selected)}<div><h3>${safe(selected.name)}</h3><p>${safe(selected.theme)}</p></div></div><div class="note-fields"><label>我的关键词<input id="noteKeywords" maxlength="180" value="${safe(note.keywords||'')}" placeholder="例如：边界、勇气、停下来"></label><label>我的正位理解<textarea id="noteUpright" placeholder="这张牌正位对我意味着什么？">${safe(note.upright||'')}</textarea></label><label>我的逆位理解<textarea id="noteReversed" placeholder="受阻、过度、内化或不足时会怎样？">${safe(note.reversed||'')}</textarea></label><label>它曾如何出现在我的生活中<textarea id="noteLifeExample" placeholder="写下一次真实经历或联想。">${safe(note.lifeExample||'')}</textarea></label></div><button class="primary" id="saveLearningNote">保存我的牌义</button></section>`;
    document.getElementById('learningNoteCard').onchange=event=>renderNotes(event.target.value);
    document.getElementById('viewNoteCard').onclick=()=>window.LifeMirrorViewer?.open(selected.id,'upright');
    document.getElementById('saveLearningNote').onclick=()=>{const current=load();const normalized=window.LifeMirrorReadingSchema.normalizeLearningNote({cardId:selected.id,keywords:document.getElementById('noteKeywords').value.trim(),upright:document.getElementById('noteUpright').value.trim(),reversed:document.getElementById('noteReversed').value.trim(),lifeExample:document.getElementById('noteLifeExample').value.trim()});current.notes={...(current.notes||{}),[selected.id]:normalized};current.studied=[...new Set([...(current.studied||[]),selected.id])];save(current);window.LifeMirrorApp?.showToast('我的牌义已保存')};
  }
  function renderProgress(){
    const data=load(), attempts=data.quizAttempts||0, correct=data.quizCorrect||0, notes=Object.keys(data.notes||{}).length, studied=(data.studied||[]).length, percent=attempts?Math.round(correct/attempts*100):0;
    content.innerHTML=`<section class="learning-progress"><header><span class="tiny-label">本地学习进度</span><h3>慢慢建立你自己的牌义系统</h3></header><div class="progress-cards"><article><strong>${studied}</strong><span>/ 78</span><small>已经学习</small></article><article><strong>${notes}</strong><span>张</span><small>写下个人牌义</small></article><article><strong>${attempts}</strong><span>题</span><small>看图识牌</small></article><article><strong>${percent}%</strong><small>识牌正确率</small></article></div><div class="learning-progress-bar"><span style="width:${Math.round(studied/78*100)}%"></span></div><p>所有学习记录目前保存在本机，并通过跨平台存储接口访问。未来转换为 Android、桌面端或微信小程序时，学习数据结构可以保持不变。</p><div class="platform-status"><strong>当前运行环境</strong><code>${safe(window.LifeMirrorPlatform?.runtime||'web')}</code><small>${safe(Object.keys(window.LifeMirrorPlatform?.capabilities||{}).filter(key=>window.LifeMirrorPlatform.capabilities[key]===true).join(' · '))}</small></div></section>`;
  }
  function switchTab(tab){activeTab=tab;tabs.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button.dataset.learningTab===tab));if(tab==='daily')renderDaily();if(tab==='quiz'){quiz=null;newQuiz()}if(tab==='notes')renderNotes();if(tab==='progress')renderProgress()}
  function open(tab='daily'){switchTab(tab);dialog.showModal()}
  function init(){dialog=document.getElementById('learningDialog');content=document.getElementById('learningContent');tabs=document.getElementById('learningTabs');if(!dialog)return;tabs.onclick=event=>{const button=event.target.closest('[data-learning-tab]');if(button)switchTab(button.dataset.learningTab)};document.getElementById('closeLearning').onclick=()=>dialog.close();document.getElementById('learningOpenLibrary').onclick=()=>{dialog.close();window.LifeMirrorLibrary?.open()};dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()})}
  window.LifeMirrorLearning={init,open,load,markStudied};
})();
