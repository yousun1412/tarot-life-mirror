(() => {
  const APP_VERSION = '14.0.0';
  const installBtn = document.getElementById('installBtn');
  const installGuide = document.getElementById('installGuide');
  const installGuideContent = document.getElementById('installGuideContent');
  const closeGuide = document.getElementById('closeInstallGuide');
  const networkBadge = document.getElementById('networkBadge');
  const updateBanner = document.getElementById('updateBanner');
  const updateTitle = document.getElementById('updateTitle');
  const updateStatus = document.getElementById('updateStatus');
  const currentVersion = document.getElementById('currentVersion');
  const latestVersion = document.getElementById('latestVersion');
  const updateNow = document.getElementById('updateNow');
  const updateRetry = document.getElementById('updateRetry');

  let deferredPrompt = null;
  let registration = null;
  let waitingWorker = null;
  let latestInfo = null;
  let updateDeadline = null;
  let checking = false;

  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const normalizeVersion = value => String(value || '0.0.0').replace(/^v/i, '').split('-')[0];
  const compareVersions = (left, right) => {
    const a = normalizeVersion(left).split('.').map(Number);
    const b = normalizeVersion(right).split('.').map(Number);
    for (let index = 0; index < Math.max(a.length, b.length); index++) {
      const delta = (a[index] || 0) - (b[index] || 0);
      if (delta) return delta;
    }
    return 0;
  };

  function notice(text, offline = false) {
    if (!networkBadge) return;
    networkBadge.textContent = text;
    networkBadge.classList.toggle('offline', offline);
    networkBadge.classList.add('show');
    clearTimeout(notice.timer);
    notice.timer = setTimeout(() => networkBadge.classList.remove('show'), 3000);
  }

  function refreshInstall() {
    if (!installBtn) return;
    installBtn.hidden = isStandalone();
  }

  function setUpdateUI({
    state = 'ready',
    title = '发现新版本',
    status = '更新后将保留当前设备上的本地记录。',
    latest = latestInfo?.version || '—',
    show = true,
    primary = '立即更新',
    disabled = false,
    retry = false
  } = {}) {
    if (!updateBanner) return;
    updateBanner.dataset.state = state;
    updateTitle.textContent = title;
    updateStatus.textContent = status;
    currentVersion.textContent = `当前 ${APP_VERSION}`;
    latestVersion.textContent = `最新 ${latest}`;
    updateNow.textContent = primary;
    updateNow.disabled = disabled;
    updateRetry.hidden = !retry;
    updateBanner.classList.toggle('show', show);
  }

  function hideUpdateUI() {
    updateBanner?.classList.remove('show');
  }

  async function fetchLatestVersion() {
    const response = await fetch(`./version.json?check=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache' }
    });
    if (!response.ok) throw new Error(`版本文件请求失败：${response.status}`);
    const info = await response.json();
    if (!info?.version) throw new Error('版本文件缺少 version 字段');
    latestInfo = info;
    return info;
  }

  function markReady(worker, version = latestInfo?.version || '新版本') {
    waitingWorker = worker;
    clearTimeout(updateDeadline);
    setUpdateUI({
      state: 'ready',
      title: '新版本已经准备好',
      status: '点击后会重新启动应用，本地历史记录不会被删除。',
      latest: version,
      primary: '立即更新',
      disabled: false,
      retry: false
    });
  }

  function attachInstallingWorker(worker) {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installing') {
        setUpdateUI({
          state: 'working',
          title: '正在下载新版本',
          status: '正在检查程序文件。牌面图片会继续按需缓存。',
          primary: '准备中…',
          disabled: true
        });
      }
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) markReady(worker);
        else hideUpdateUI();
      }
      if (worker.state === 'redundant') {
        setUpdateUI({
          state: 'error',
          title: '新版本准备失败',
          status: '可能有文件尚未部署完成，请稍后重试。',
          primary: '无法更新',
          disabled: true,
          retry: true
        });
      }
    });
  }

  async function checkForUpdate({ silent = true } = {}) {
    if (!registration || checking || !navigator.onLine) return;
    checking = true;
    try {
      const info = await fetchLatestVersion();
      if (compareVersions(info.version, APP_VERSION) <= 0) {
        if (!waitingWorker) hideUpdateUI();
        return;
      }

      if (registration.waiting) {
        markReady(registration.waiting, info.version);
        return;
      }

      setUpdateUI({
        state: 'working',
        title: `发现 ${info.version} 版本`,
        status: '正在准备更新，请保持网络连接。',
        latest: info.version,
        primary: '准备中…',
        disabled: true
      });

      await registration.update();
      if (registration.waiting) {
        markReady(registration.waiting, info.version);
        return;
      }
      if (registration.installing) attachInstallingWorker(registration.installing);

      clearTimeout(updateDeadline);
      updateDeadline = setTimeout(() => {
        if (!waitingWorker) {
          setUpdateUI({
            state: 'error',
            title: '暂时无法完成更新',
            status: 'GitHub Pages 可能仍在部署文件，等待一分钟后重试即可。',
            latest: info.version,
            primary: '尚未就绪',
            disabled: true,
            retry: true
          });
        }
      }, 12000);
    } catch (error) {
      console.warn('Update check failed:', error);
      if (!silent) {
        setUpdateUI({
          state: 'error',
          title: '检查更新失败',
          status: navigator.onLine ? '无法读取版本信息，请稍后重试。' : '当前处于离线状态。',
          primary: '无法更新',
          disabled: true,
          retry: true
        });
      }
    } finally {
      checking = false;
    }
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    try {
      registration = await navigator.serviceWorker.register('./service-worker.js', {
        scope: './',
        updateViaCache: 'none'
      });

      if (registration.waiting) markReady(registration.waiting);
      if (registration.installing) attachInstallingWorker(registration.installing);

      registration.addEventListener('updatefound', () => {
        attachInstallingWorker(registration.installing);
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        clearTimeout(updateDeadline);
        setUpdateUI({
          state: 'success',
          title: '更新完成',
          status: '正在重新启动应用……',
          latest: latestInfo?.version || APP_VERSION,
          primary: '已完成',
          disabled: true
        });
        setTimeout(() => location.reload(), 650);
      });

      await checkForUpdate({ silent: true });
    } catch (error) {
      console.warn('Service worker registration failed:', error);
      notice('离线功能初始化失败', true);
    }
  }

  addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    refreshInstall();
  });

  addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installBtn.hidden = true;
    notice('已安装到设备');
  });

  installBtn?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      refreshInstall();
      return;
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    installGuideContent.innerHTML = ios
      ? '<p>在 Safari 中安装：</p><ol><li>点击底部“分享”。</li><li>选择“添加到主屏幕”。</li><li>点击“添加”。</li></ol>'
      : '<p>打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。</p>';
    installGuide.showModal();
  });

  closeGuide?.addEventListener('click', () => installGuide.close());

  updateNow?.addEventListener('click', async () => {
    if (!waitingWorker) {
      await checkForUpdate({ silent: false });
      if (!waitingWorker) return;
    }
    setUpdateUI({
      state: 'working',
      title: '正在切换到新版本',
      status: '请不要关闭页面，通常只需要几秒钟。',
      latest: latestInfo?.version || '新版本',
      primary: '更新中…',
      disabled: true
    });
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    clearTimeout(updateDeadline);
    updateDeadline = setTimeout(() => {
      setUpdateUI({
        state: 'error',
        title: '更新响应超时',
        status: '关闭并重新打开应用，或点击重试。',
        primary: '等待重试',
        disabled: true,
        retry: true
      });
    }, 12000);
  });

  updateRetry?.addEventListener('click', async () => {
    waitingWorker = registration?.waiting || null;
    if (waitingWorker) markReady(waitingWorker);
    else await checkForUpdate({ silent: false });
  });

  addEventListener('online', () => {
    notice('网络已恢复');
    checkForUpdate({ silent: true });
  });
  addEventListener('offline', () => notice('已进入离线模式', true));
  addEventListener('focus', () => checkForUpdate({ silent: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate({ silent: true });
  });

  refreshInstall();
  if (!navigator.onLine) notice('已进入离线模式', true);
  addEventListener('load', registerServiceWorker);
  setInterval(() => checkForUpdate({ silent: true }), 15 * 60 * 1000);
})();
