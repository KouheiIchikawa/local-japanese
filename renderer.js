'use strict';
const fs = require('fs');
const path = require('path');
const { install } = require('./dom');
const { loadOverrides } = require('./i18n');
module.exports = function LocalJapaneseRenderer(context) {
  const dataPath = context.environment.userDataPath;
  loadOverrides(path.join(dataPath, 'local-japanese-overrides.json'));
  let language = 'ja';
  try { language = JSON.parse(fs.readFileSync(path.join(dataPath, 'local-japanese-settings.json'), 'utf8')).language || 'ja'; } catch (_) {}
  const protectedValues = new Set();
  function protectSites() {
    try {
      const sites = JSON.parse(fs.readFileSync(path.join(dataPath, 'sites.json'), 'utf8'));
      for (const site of Object.values(sites)) for (const key of ['name', 'domain', 'path', 'id']) {
        if (typeof site[key] === 'string') protectedValues.add(site[key]);
      }
    } catch (_) {}
  }
  protectSites();
  const controller = install(document, { language, protectedValues });
  document.addEventListener('input', event => {
    if (typeof event.target.value === 'string' && event.target.value.trim()) protectedValues.add(event.target.value.trim());
  }, true);
  const { React, hooks, electron } = context;
  require('./site-status').register(context, controller);
  function LanguageSettings() {
    const [selected, setSelected] = React.useState(controller.language);
    return React.createElement('div', { 'data-local-japanese': true, style: { padding: 24, maxWidth: 650 } },
      React.createElement('label', { htmlFor: 'local-japanese-language', style: { display: 'block', marginBottom: 12 } }, '表示言語 / Display language'),
      React.createElement('select', { id: 'local-japanese-language', value: selected, style: { display: 'block', width: 220, maxWidth: '100%', minWidth: 0, height: 44, minHeight: 44, padding: '0 12px', fontSize: 16, lineHeight: 'normal', appearance: 'auto', boxSizing: 'border-box' }, onChange: event => {
        const next = event.target.value; setSelected(next); controller.setLanguage(next);
        electron.ipcRenderer.send('local-japanese:language', next);
      } }, React.createElement('option', { value: 'ja' }, '日本語'), React.createElement('option', { value: 'en' }, 'English')),
      React.createElement('p', { style: { marginTop: 20, lineHeight: 1.8 } }, '表示言語は自動保存されます。メニュー全体への反映にはLocalの再起動が必要です。'),
      React.createElement('p', { style: { lineHeight: 1.8 } }, '翻訳のない項目は英語で表示されます。サイト名や入力した内容は変更されません。'),
      React.createElement('p', { style: { marginTop: 24, fontSize: 12, color: '#53615b' } }, '© 2026 Kohei Elimi Lab'));
  }
  hooks.addFilter('preferencesMenuItems', items => [...items, { path: 'local-japanese', displayName: '日本語 / Language', sections: LanguageSettings, onApply() {} }]);
};
