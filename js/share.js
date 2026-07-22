(() => {
  let dialog, canvas, ctx, target = null, includeQuestion, status;
  const W = 1080, H = 1350;
  const cardData = raw => window.LIFE_MIRROR_DATA?.cards?.find(card => card.id === raw.id) || window.LIFE_MIRROR_DATA?.cards?.find(card => card.name === raw.name) || raw;
  const loadImage = src => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });

  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function wrap(text, x, y, maxWidth, lineHeight, maxLines = 99) {
    const chars = [...String(text || '')]; let line = '', lines = [];
    for (const char of chars) { const test = line + char; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = char; } else line = test; }
    if (line) lines.push(line); lines = lines.slice(0,maxLines); if (lines.length === maxLines && chars.length) lines[maxLines-1] = lines[maxLines-1].replace(/.$/,'…');
    lines.forEach((item,index) => ctx.fillText(item,x,y+index*lineHeight)); return y+lines.length*lineHeight;
  }
  function fitImage(img, x, y, w, h, reversed) {
    const ratio = Math.min(w/img.width,h/img.height), dw=img.width*ratio, dh=img.height*ratio;
    ctx.save(); ctx.translate(x+w/2,y+h/2); if(reversed) ctx.rotate(Math.PI); ctx.drawImage(img,-dw/2,-dh/2,dw,dh); ctx.restore();
  }

  async function generate() {
    if (!target) return;
    status.textContent = '正在生成分享卡……';
    const cardCount = (target.cards || []).length;
    const isLargeSpread = cardCount >= 5;
    const canvasHeight = cardCount >= 8 ? 1900 : isLargeSpread ? 1780 : H;
    canvas.width=W;canvas.height=canvasHeight;
    const grad=ctx.createLinearGradient(0,0,0,canvasHeight);grad.addColorStop(0,'#211725');grad.addColorStop(.55,'#18352f');grad.addColorStop(1,'#100b14');ctx.fillStyle=grad;ctx.fillRect(0,0,W,canvasHeight);
    ctx.strokeStyle='rgba(233,197,124,.45)';ctx.lineWidth=3;ctx.strokeRect(34,34,W-68,canvasHeight-68);
    ctx.fillStyle='#e9c57c';ctx.font='600 28px sans-serif';ctx.fillText('✦ 生命之镜塔罗',72,92);
    const shareTitle = target.readingType === 'daily'
      ? (target.spread === 'daily-three' ? '本日运势 · 三张牌' : '本日运势 · 今日主题')
      : target.readingType === 'weekly'
        ? (target.spread === 'weekly-seven' ? '本周运势 · 完整地图' : '本周运势 · 三张牌')
        : target.readingType === 'monthly'
          ? (target.spread === 'monthly-seven' ? '本月运势 · 完整地图' : '本月运势 · 五张牌')
        : target.spread === 'choice-six' ? '两个选择 · 六张牌'
          : target.spread === 'relationship-five' ? '关系模式 · 五张牌'
          : target.spread === 'obstacle-four' ? '阻力与资源 · 四张牌'
          : target.spread === 'celtic-ten' ? '凯尔特十字 · 十张牌'
          : (target.spread === 'three' ? '三张反思牌阵' : '此刻需要看见');
    ctx.fillStyle='#f7edd8';ctx.font='700 51px serif';ctx.fillText(shareTitle,72,162);
    ctx.fillStyle='rgba(247,237,216,.65)';ctx.font='24px sans-serif';ctx.fillText(`${target.periodLabel || target.topic || '自我反思'} · ${target.drawMode==='fate'?'交给命运':'自选数字'} · ${target.date || new Date().toLocaleDateString()}`,72,205);
    let y=260;
    if(includeQuestion.checked && target.question){ctx.fillStyle='rgba(255,255,255,.07)';roundedRect(62,y,W-124,128,24);ctx.fillStyle='#f4e9d5';ctx.font='28px sans-serif';y=wrap(`“${target.question}”`,88,y+46,W-176,39,2)+30;} else y+=20;
    const cards=target.cards||[];
    if (cards.length >= 5) {
      const rowIndexes = cards.length === 4 ? [[0,1,2,3]]
        : cards.length === 5 ? [[0,1,2],[3,4]]
        : cards.length === 6 ? [[0,1,2],[3,4,5]]
        : cards.length === 7 ? [[0,1,2,3],[4,5,6]]
        : cards.length === 10 ? [[0,1,2,3,4],[5,6,7,8,9]]
        : Array.from({length:Math.ceil(cards.length/4)},(_,row)=>Array.from({length:Math.min(4,cards.length-row*4)},(_,col)=>row*4+col));
      const maxCols=Math.max(...rowIndexes.map(row=>row.length));
      const gapX=maxCols>=5?20:34, gapY=88;
      const cardW=Math.min(185,Math.floor((W-144-(maxCols-1)*gapX)/maxCols)), cardH=cardW*1.675;
      const rows=rowIndexes;
      for(let row=0;row<rows.length;row++){
        const indexes=rows[row], total=indexes.length*cardW+(indexes.length-1)*gapX, startX=(W-total)/2;
        for(let col=0;col<indexes.length;col++){
          const i=indexes[col], raw=cards[i], card=cardData(raw), x=startX+col*(cardW+gapX), cardY=y+row*(cardH+gapY);
          ctx.fillStyle='rgba(0,0,0,.32)';roundedRect(x-6,cardY-6,cardW+12,cardH+12,16);
          try{const img=await loadImage(card.image);fitImage(img,x,cardY,cardW,cardH,raw.orientation==='reversed');}catch(e){ctx.fillStyle='#2b2038';roundedRect(x,cardY,cardW,cardH,14);ctx.fillStyle='#fff';ctx.font='26px sans-serif';ctx.textAlign='center';ctx.fillText(card.name,x+cardW/2,cardY+cardH/2);ctx.textAlign='left';}
          ctx.fillStyle='#f7edd8';ctx.font=`700 ${maxCols>=5?14:18}px sans-serif`;ctx.textAlign='center';ctx.fillText(`${raw.position||''}｜${card.name}${raw.orientation==='reversed'?'（逆）':''}`,x+cardW/2,cardY+cardH+30);ctx.textAlign='left';
        }
      }
      y += rows.length*cardH+Math.max(0,rows.length-1)*gapY+72;
    } else {
      const gap=28, cardW=cards.length===1?330:250, cardH=cardW*1.675, total=cards.length*cardW+(cards.length-1)*gap, start=(W-total)/2;
      for(let i=0;i<cards.length;i++){
        const raw=cards[i], card=cardData(raw), x=start+i*(cardW+gap);
        ctx.fillStyle='rgba(0,0,0,.32)';roundedRect(x-8,y-8,cardW+16,cardH+16,18);
        try{const img=await loadImage(card.image);fitImage(img,x,y,cardW,cardH,raw.orientation==='reversed');}catch(e){ctx.fillStyle='#2b2038';roundedRect(x,y,cardW,cardH,14);ctx.fillStyle='#fff';ctx.font='34px sans-serif';ctx.textAlign='center';ctx.fillText(card.name,x+cardW/2,y+cardH/2);ctx.textAlign='left';}
        ctx.fillStyle='#f7edd8';ctx.font='700 24px sans-serif';ctx.textAlign='center';ctx.fillText(`${raw.position ? raw.position+'｜' : ''}${card.name}${raw.orientation==='reversed'?'（逆）':''}${raw.deckNumber ? ' · #'+raw.deckNumber : ''}`,x+cardW/2,y+cardH+42);ctx.textAlign='left';
      }
      y += cardH+92;
    };ctx.fillStyle='#e9c57c';ctx.font='700 26px sans-serif';ctx.fillText('本次提示',72,y);y+=46;ctx.fillStyle='#e9deca';ctx.font='26px sans-serif';wrap(target.summary||'把牌面当作一面镜子，核对现实，再决定下一步。',72,y,W-144,39,5);
    ctx.fillStyle='rgba(247,237,216,.48)';ctx.font='20px sans-serif';ctx.fillText('用于塔罗文化学习、娱乐与自我反思，不构成确定性预测。',72,canvasHeight-82);
    status.textContent='分享卡已生成。默认不显示完整问题，可在右侧切换。';
  }
  async function download(){await generate();const a=document.createElement('a');const spreadName=target?.spread==='choice-six'?'选择牌阵-':target?.spread==='relationship-five'?'关系牌阵-':target?.spread==='obstacle-four'?'阻力资源-':target?.spread==='celtic-ten'?'凯尔特十字-':'';a.download=`生命之镜塔罗-${target?.readingType==='daily'?'本日运势-':target?.readingType==='weekly'?'本周运势-':target?.readingType==='monthly'?'本月运势-':spreadName}${Date.now()}.png`;a.href=canvas.toDataURL('image/png');a.click();}
  async function nativeShare(){await generate();if(!navigator.share){status.textContent='当前浏览器不支持原生分享，请使用“保存图片”。';return;}const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));const file=new File([blob],'生命之镜塔罗.png',{type:'image/png'});try{await navigator.share({title:'生命之镜塔罗',text:'我的塔罗反思记录',files:[file]});}catch(e){if(e.name!=='AbortError')status.textContent='分享未完成，请改用保存图片。';}}
  function open(snapshot){target=snapshot;includeQuestion.checked=false;dialog.showModal();generate();}
  function init(){dialog=document.getElementById('shareDialog');canvas=document.getElementById('shareCanvas');if(!dialog)return;ctx=canvas.getContext('2d');includeQuestion=document.getElementById('shareIncludeQuestion');status=document.getElementById('shareStatus');document.getElementById('closeShare').onclick=()=>dialog.close();document.getElementById('shareDownload').onclick=download;document.getElementById('shareNative').onclick=nativeShare;includeQuestion.onchange=generate;dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});}
  window.LifeMirrorShare={init,open,generate};
})();
