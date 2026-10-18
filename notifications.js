'use strict';
const {translate} = require('./i18n');
const installed = Symbol.for('local-japanese.notifications');
function install(Notification, getLanguage) {
  const prototype = Notification && Notification.prototype;
  if (!prototype || typeof prototype.show !== 'function' || prototype[installed]) return;
  const originalShow = prototype.show;
  const originals = new WeakMap();
  prototype.show = function(...args) {
    const language = getLanguage();
    const record = originals.get(this) || {};
    for (const key of ['title', 'subtitle', 'body']) {
      const current = this[key];
      if (typeof current !== 'string') continue;
      if (!record[key] || current !== record[key].translated) record[key] = {original: current};
      let value = translate(record[key].original, language);
      if (language === 'ja' && key === 'title' && value === record[key].original && value.endsWith(' Added')) {
        value = value.slice(0, -6) + ' を追加しました';
      }
      record[key].translated = value;
      this[key] = value;
    }
    originals.set(this, record);
    return originalShow.apply(this, args);
  };
  Object.defineProperty(prototype, installed, {value: true});
}
module.exports = {install};
