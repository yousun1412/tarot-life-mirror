(() => {
  const installBtn=document.getElementById('installBtn'),installGuide=document.getElementById('installGuide'),installGuideContent=document.getElementById('installGuideContent'),closeGuide=document.getElementById('closeInstallGuide'),networkBadge=document.getElementById('networkBadge'),updateBanner=document.getElementById('updateBanner'),updateNow=document.getElementById('updateNow');
  let deferredPrompt=null,waitingWorker=null;
  const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function notice(text,offline=false){if(!networkBadge)return;networkBadge.textContent=text;networkBadge.classList.toggle('offline',offline);networkBadge.classList.add('show');clearTimeout(notice.timer);notice.timer=setTimeout(()=>networkBadge.classList.remove('show'),2800);}
  function refreshInstall(){if(!installBtn)return;if(isStandalone()){installBtn.hidden=true;return;}installBtn.hidden=false;}
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;refreshInstall();});
  addEventListener('appinstalled',()=>{deferredPrompt=null;installBtn.hidden=true;notice('已安装到设备');});
  installBtn?.addEventListener('click',async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;refreshInstall();return;}const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);installGuideContent.innerHTML=ios?'<p>在 Safari 中安装：</p><ol><li>点击底部“分享”。</li><li>选择“添加到主屏幕”。</li><li>点击“添加”。</li></ol>':'<p>打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。</p>';installGuide.showModal();});
  closeGuide?.addEventListener('click',()=>installGuide.close());
  addEventListener('online',()=>notice('网络已恢复'));addEventListener('offline',()=>notice('已进入离线模式',true));
  function showUpdate(worker){waitingWorker=worker;updateBanner.classList.add('show');}
  updateNow?.addEventListener('click',()=>waitingWorker?.postMessage({type:'SKIP_WAITING'}));
  if('serviceWorker'in navigator&&location.protocol!=='file:')addEventListener('load',async()=>{try{const registration=await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});if(registration.waiting)showUpdate(registration.waiting);registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate(worker);});});navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());setInterval(()=>registration.update(),60*60*1000);}catch(error){console.warn('Service worker registration failed:',error);}});
  refreshInstall();if(!navigator.onLine)notice('已进入离线模式',true);
})();
