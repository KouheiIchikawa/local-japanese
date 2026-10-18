'use strict';
const i18next = require('i18next');
const dictionary = require('./locales/ja.json');
const instance = i18next.createInstance();
instance.init({
  lng: 'ja', fallbackLng: false, initImmediate: false, initAsync: false,
  keySeparator: false, nsSeparator: false, saveMissing: false,
  interpolation: { escapeValue: false },
  resources: { ja: { translation: dictionary } },
});
const normalize = value => value.replace(/\s+/g, ' ').trim();
function translate(value, language = 'ja') {
  if (language !== 'ja' || typeof value !== 'string' || !value.trim()) return value;
  const key = normalize(value);
  let result;
  if (Object.hasOwn(dictionary, key)) result = instance.t(key);
  else {
    let match;
    if ((match = key.match(/^(\d+) sites? running$/))) result = `${match[1]} サイト稼働中`;
    else if ((match = key.match(/^Update to (\d[\w.+-]*)$/))) result = `${match[1]} に更新`;
    else if ((match = key.match(/^Update to WordPress (\d[\w.+-]*)$/))) result = `WordPress ${match[1]} に更新`;
    else if ((match = key.match(/^(\d+) sites? selected$/))) result = `${match[1]} サイトを選択中`;
    else return value;
  }
  return value.match(/^\s*/)[0] + result + value.match(/\s*$/)[0];
}
function loadOverrides(file) {
  try {
    const extra = JSON.parse(require('fs').readFileSync(file, 'utf8'));
    const valid = Object.fromEntries(Object.entries(extra).filter(([key, value]) => typeof value === 'string' && key.trim()).map(([key,value]) => [normalize(key),value]));
    Object.assign(dictionary, valid);
    instance.addResourceBundle('ja', 'translation', valid, true, true);
  } catch (error) { if (error.code !== 'ENOENT') console.warn('[Local Japanese] Invalid overrides JSON; using bundled dictionary.'); }
}
module.exports = { translate, dictionary, normalize, loadOverrides };
