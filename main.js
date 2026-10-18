'use strict';
const fs = require('fs');
const path = require('path');
const { translate, loadOverrides } = require('./i18n');
module.exports = function LocalJapaneseMain(context) {
  const { app, Menu, ipcMain } = context.electron;
  if (!app || app.__localJapanese) return;
  app.__localJapanese = true;
  ipcMain.handle('local-japanese:web-check', async (event, id) => {
    try {
      const expected = path.resolve(context.environment.appPath, 'renderer', '_browserWindows', 'app', 'app-windows.html');
      if (!event.senderFrame || path.resolve(require('url').fileURLToPath(event.senderFrame.url)).toLowerCase() !== expected.toLowerCase()) throw Error('Invalid sender');
      const sites = JSON.parse(fs.readFileSync(path.join(context.environment.userDataPath, 'sites.json'), 'utf8'));
      if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(sites, id)) throw Error('Unknown site');
      const domain = sites[id].domain;
      if (typeof domain !== 'string' || !/^[a-zA-Z0-9.-]+$/.test(domain)) throw Error('Invalid domain');
      return await require('./web-check').probe(domain);
    } catch (_) { return {ready:false, reason:'Unable to check'}; }
  });
  loadOverrides(path.join(context.environment.userDataPath, 'local-japanese-overrides.json'));
  const settingsPath = path.join(context.environment.userDataPath, 'local-japanese-settings.json');
  let settings = { language: 'ja' };
  try { settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) }; } catch (_) {}
  require('./notifications').install(context.electron.Notification, () => settings.language);
  // A narrow menu adapter preserves all existing click handlers, roles and accelerators.
  const convert = template => template.map(item => {
    if (!item || typeof item !== 'object') return item;
    const copy = { ...item };
    if (typeof copy.label === 'string') copy.label = translate(copy.label, settings.language);
    if (Array.isArray(copy.submenu)) copy.submenu = convert(copy.submenu);
    return copy;
  });
  const build = Menu.buildFromTemplate;
  Menu.buildFromTemplate = function(template) { return build.call(this, convert(template)); };
  context.hooks.addFilter('appMenu', convert);
  for (const method of ['showMessageBox', 'showMessageBoxSync', 'showOpenDialog', 'showOpenDialogSync', 'showSaveDialog', 'showSaveDialogSync']) {
    const original = context.electron.dialog[method];
    if (typeof original !== 'function') continue;
    context.electron.dialog[method] = function(...args) {
      const index = args.length > 1 && args[0] instanceof context.electron.BrowserWindow ? 1 : 0;
      const options = args[index];
      if (options && typeof options === 'object') {
        const translated = { ...options };
        for (const key of ['title', 'message', 'detail', 'checkboxLabel', 'buttonLabel']) {
          if (typeof translated[key] === 'string') translated[key] = translate(translated[key], settings.language);
        }
        if (Array.isArray(options.buttons)) translated.buttons = options.buttons.map(label => translate(label, settings.language));
        args[index] = translated;
      }
      return original.apply(this, args);
    };
  }
  app.on('browser-window-created', (_, window) => {
    window.webContents.on('did-finish-load', () => {
      const url = window.webContents.getURL();
      if (!/^file:.*app\.asar\/renderer\/_browserWindows\/(about|updater)\//.test(url)) return;
      const code = `require(${JSON.stringify(path.join(__dirname, 'dom.js'))}).install(document, { language: ${JSON.stringify(settings.language)} });`;
      window.webContents.executeJavaScript(code).catch(() => {});
    });
  });
  ipcMain.on('local-japanese:language', (event, language) => {
    const url = event.sender.getURL();
    if (!url.startsWith('file:') || !url.includes('app.asar/renderer/')) return;
    if (!['ja', 'en'].includes(language)) return;
    settings.language = language;
    fs.writeFileSync(settingsPath + '.tmp', JSON.stringify(settings, null, 2));
    fs.renameSync(settingsPath + '.tmp', settingsPath);
  });
  fs.writeFileSync(path.join(context.environment.userDataPath, 'local-japanese-status.json'), JSON.stringify({
    notificationsEnabled: Boolean(context.electron.Notification?.prototype[Symbol.for('local-japanese.notifications')]),
    addonVersion: require('./package.json').version, localVersion: context.environment.version,
    loadedAt: new Date().toISOString(), language: settings.language, addonPath: __dirname,
  }, null, 2));
};
