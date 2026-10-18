'use strict';
// Translate text in place: never replace elements/innerHTML, values, URLs or React handlers.
const { translate } = require('./i18n');
const SKIP = 'script,style,textarea,input,code,pre,[contenteditable="true"],[translate="no"],.notranslate,[data-local-japanese],.TID_SiteListSite_Span_SiteName,.__Site__Label,.__Selectable,[class*="SiteListGroupHeader_Name"],[class*="SiteInfoHeader_SiteName"],[class*="SiteListSite_Name"],[class*="SitePath"],[class*="BackupDescription"]';
function install(document, options = {}) {
  const view = document.defaultView;
  if (view.__localJapanese) return view.__localJapanese;
  let language = options.language || 'ja';
  const originals = new WeakMap();
  const attributes = new WeakMap();
  const protectedValues = options.protectedValues || new Set();
  let translated = 0;
  function isProtected(element) { return !element || !!element.closest(SKIP); }
  function text(node) {
    if (isProtected(node.parentElement)) return;
    // Select options without a value use text as their value. Preserve that contract.
    if (node.parentElement.tagName === 'OPTION' && !node.parentElement.hasAttribute('value')) return;
    const current = node.nodeValue;
    const previous = originals.get(node);
    const source = previous && current === previous.output ? previous.source : current;
    const output = protectedValues.has(source.trim()) ? source : translate(source, language);
    originals.set(node, { source, output });
    if (output !== current) { node.nodeValue = output; translated++; }
  }
  function attr(element) {
    if (element.closest('[data-local-japanese],[translate="no"],.notranslate')) return;
    let saved = attributes.get(element);
    if (!saved) { saved = {}; attributes.set(element, saved); }
    for (const key of ['title', 'placeholder', 'aria-label']) {
      if (!element.hasAttribute(key)) continue;
      const current = element.getAttribute(key), old = saved[key];
      const source = old && current === old.output ? old.source : current;
      const output = protectedValues.has(source.trim()) ? source : translate(source, language);
      saved[key] = { source, output };
      if (current !== output) element.setAttribute(key, output);
    }
  }
  function scan(root) {
    if (root.nodeType === 3) { text(root); return; }
    if (![1, 9, 11].includes(root.nodeType)) return;
    if (root.nodeType === 1) attr(root);
    const walker = document.createTreeWalker(root, 1 | 4);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === 3) text(node); else attr(node);
    }
  }
  const observer = new view.MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') text(record.target);
      else if (record.type === 'attributes') attr(record.target);
      else for (const node of record.addedNodes) scan(node);
    }
  });
  scan(document.body || document.documentElement);
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label'] });
  document.documentElement.lang = language;
  const controller = {
    setLanguage(next) { language = next === 'en' ? 'en' : 'ja'; document.documentElement.lang = language; scan(document.body); },
    scan, get language() { return language; }, get translated() { return translated; },
    disconnect() { observer.disconnect(); delete view.__localJapanese; },
  };
  view.__localJapanese = controller;
  return controller;
}
module.exports = { install, SKIP };
