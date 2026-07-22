/* V20 跨平台能力层：Web 当前实现，预留 Capacitor / Tauri / 微信小程序适配器。 */
(() => {
  const registry = new Map();
  const detectRuntime = () => {
    if (globalThis.wx?.getSystemInfoSync && !globalThis.document) return 'wechat';
    if (globalThis.Capacitor?.isNativePlatform?.()) return 'capacitor';
    if (globalThis.__TAURI_INTERNALS__ || globalThis.__TAURI__) return 'tauri';
    return 'web';
  };
  const runtime = detectRuntime();
  const memoryStorage = new Map();
  const webStorage = {
    getSync(key, fallback = null) {
      try { const value = localStorage.getItem(key); if (value !== null) memoryStorage.set(key, value); return value === null ? (memoryStorage.get(key) ?? fallback) : value; }
      catch (error) { console.warn('storage get failed; using memory fallback', error); return memoryStorage.get(key) ?? fallback; }
    },
    setSync(key, value) {
      memoryStorage.set(key, String(value));
      try { localStorage.setItem(key, String(value)); return true; }
      catch (error) { console.warn('storage set failed; using memory fallback', error); return true; }
    },
    removeSync(key) {
      memoryStorage.delete(key);
      try { localStorage.removeItem(key); return true; }
      catch (error) { console.warn('storage remove failed; memory fallback cleared', error); return true; }
    },
    async get(key, fallback = null) { return this.getSync(key, fallback); },
    async set(key, value) { return this.setSync(key, value); },
    async remove(key) { return this.removeSync(key); }
  };
  registry.set('storage', webStorage);
  const capabilities = Object.freeze({
    runtime,
    native: runtime !== 'web',
    share: Boolean(navigator.share),
    fileDownload: runtime === 'web',
    serviceWorker: 'serviceWorker' in navigator,
    vibration: 'vibrate' in navigator,
    persistentStorage: Boolean(navigator.storage?.persist)
  });
  const api = {
    runtime,
    capabilities,
    register(name, adapter) { if (!name || !adapter) throw new Error('adapter name and object are required'); registry.set(name, adapter); },
    adapter(name) { return registry.get(name); },
    get storage() { return registry.get('storage'); },
    async share(payload) {
      const adapter = registry.get('share');
      if (adapter?.share) return adapter.share(payload);
      if (navigator.share) return navigator.share(payload);
      return false;
    },
    async vibrate(pattern = 18) {
      const adapter = registry.get('haptics');
      if (adapter?.vibrate) return adapter.vibrate(pattern);
      return navigator.vibrate?.(pattern) || false;
    },
    describe() { return { runtime, capabilities: { ...capabilities }, adapters: [...registry.keys()] }; }
  };
  window.LifeMirrorPlatform = api;
})();
