'use strict';
function statusView(status) {
  if (status === 'running') return { kind: 'running', label: '稼働中', en: 'Running', icon: '✓' };
  if (status === 'starting') return { kind: 'starting', label: '起動中', en: 'Starting', icon: '◌' };
  if (status === 'stopping') return { kind: 'busy', label: '停止処理中', en: 'Stopping', icon: '◌' };
  if (status === 'halted' || status === 'stopped') return { kind: 'stopped', label: '停止中', en: 'Stopped', icon: '■' };
  if (typeof status === 'string' && /error|failed|missing/.test(status)) return { kind: 'error', label: 'エラー', en: 'Error', icon: '!' };
  if (!status) return { kind: 'unknown', label: '状態を確認中', en: 'Checking status', icon: '…' };
  return { kind: 'busy', label: '処理中', en: 'Working', icon: '◌' };
}
function register(context, controller) {
  const { React, hooks } = context;
  const css = document.createElement('style');
  css.textContent = `
    .lj-site-state{display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border-radius:999px;border:1px solid #b9c2ca;background:#edf0f3;color:#3e4851;font:600 13px/1.35 system-ui,sans-serif;white-space:nowrap;box-sizing:border-box;margin-right:10px}
    .lj-site-state[data-state="running"]{background:#e3f5e9;color:#166534;border-color:#86c89b}
    .lj-site-state[data-state="starting"],.lj-site-state[data-state="busy"]{background:#fff3d9;color:#805000;border-color:#dbb558}
    .lj-site-state[data-state="error"]{background:#fee8e7;color:#a01c1c;border-color:#de9797}
    .lj-state-spinner{display:inline-block;animation:lj-state-spin 1.2s linear infinite;font-size:18px;line-height:16px}
    @keyframes lj-state-spin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.lj-state-spinner{animation:none}}
    .lj-start-notice{position:fixed;bottom:76px;left:50%;transform:translateX(-50%);z-index:10000;width:max-content;max-width:calc(100vw - 48px);box-sizing:border-box;padding:14px 44px 14px 20px;border-radius:10px;box-shadow:0 4px 18px #0003;border:1px solid #86c89b;background:#e3f5e9;color:#14532d;font:14px/1.6 system-ui,sans-serif;white-space:normal;overflow-wrap:anywhere;text-align:left}
    .lj-start-notice strong{display:block;font-size:16px}
    .lj-start-notice button{position:absolute;right:10px;top:8px;border:0;background:transparent;color:inherit;font-size:22px;cursor:pointer;padding:3px 6px}
    .lj-start-notice[data-error="true"]{background:#fee8e7;color:#a01c1c;border-color:#de9797}
  `;
  document.head.appendChild(css);
  function SiteState({ site, status }) {
    const previous = React.useRef({ id: site.id, status });
    const began = React.useRef(Date.now());
    const [seconds, setSeconds] = React.useState(0);
    const [notice, setNotice] = React.useState(null);
    const [, languageTick] = React.useState(0);
    const [web, setWeb] = React.useState({checking:true, ready:false});
    const startupPending = React.useRef(false);
    React.useEffect(() => {
      let active = true, timer;
      setWeb({checking:true, ready:false});
      if (status !== 'running') return () => { active = false; };
      async function check() {
        let result;
        try { result = await context.electron.ipcRenderer.invoke('local-japanese:web-check', site.id); }
        catch (_) { result = {ready:false, reason:'Unable to check'}; }
        if (!active) return;
        setWeb({...result, checking:false});
        if (result.ready && startupPending.current) { startupPending.current = false; setNotice('ready'); }
        timer = setTimeout(check, result.ready ? 15000 : 2000);
      }
      check();
      return () => { active = false; clearTimeout(timer); };
    }, [site.id, status]);
    const view = status === 'running' ? web.ready
      ? {kind:'running', label:'応答確認済み', en:'HTTP ready', icon:'✓'}
      : web.checking ? {kind:'busy', label:'応答確認中', en:'Checking response', icon:'◌'}
      : {kind:'error', label:'応答未確認', en:'No verified response', icon:'!'}
      : statusView(status);
    const ja = controller.language !== 'en';
    React.useEffect(() => {
      const observer = new MutationObserver(()=>languageTick(x=>x+1));
      observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
      return ()=>observer.disconnect();
    }, []);
    React.useEffect(() => {
      const old = previous.current;
      if (old.id !== site.id) { setNotice(null); startupPending.current = false; }
      else if (old.status === 'starting' && status === 'running') startupPending.current = true;
      if (status === 'starting') { startupPending.current = true; setNotice(null); }
      if (status !== 'starting' && status !== 'running') startupPending.current = false;
      if (old.status === 'starting' && (view.kind === 'error' || view.kind === 'stopped')) setNotice('failed');
      previous.current = { id: site.id, status };
      began.current = Date.now(); setSeconds(0);
      if (status !== 'starting') return;
      const timer = setInterval(()=>setSeconds(Math.floor((Date.now()-began.current)/1000)),1000);
      return ()=>clearInterval(timer);
    }, [site.id, status]);
    React.useEffect(() => {
      if (!notice) return;
      const timer=setTimeout(()=>setNotice(null),notice === 'ready' ? 6500 : 12000);
      return ()=>clearTimeout(timer);
    }, [notice]);
    const text = (ja ? view.label : view.en) + (view.kind === 'starting' ? `… ${seconds}${ja ? '秒' : 's'}` : '');
    const hint = view.kind === 'running' ? (ja ? 'サイトからHTTP応答を確認しました。画面の描画完了はブラウザーで確認してください。' : 'HTTP response verified. Check the browser for completed rendering.') : view.kind === 'starting' && seconds >= 30 ? (ja ? '起動に時間がかかっています。Localのエラー表示も確認してください。' : 'Startup is taking longer. Check Local for errors.') : text;
    return React.createElement(React.Fragment, null,
      React.createElement('span', { className:'lj-site-state', 'data-state':view.kind, 'data-local-japanese':true, title:hint, role:'status', 'aria-live':'polite', 'aria-label':ja?view.label:view.en },
        React.createElement('span', { 'aria-hidden':true, className:['starting','busy'].includes(view.kind)?'lj-state-spinner':undefined }, view.icon),
        React.createElement('span', null, text)),
      notice && React.createElement('div',{className:'lj-start-notice','data-local-japanese':true,'data-error':notice==='failed',role:notice==='failed'?'alert':'status'},
        React.createElement('strong',null, notice==='ready'?(ja?'✓ サイトの応答を確認しました':'✓ Site started'):(ja?'起動を完了できませんでした':'Site did not start')),
        React.createElement('span',null,site.name),
        React.createElement('div',null,notice==='ready'?(ja?'「サイトを開く」から表示できます。':'Use Open site to view it.'):(ja?'Localに表示されたエラーを確認してください。':'Check the error shown in Local.')),
        React.createElement('button',{type:'button','aria-label':ja?'通知を閉じる':'Dismiss notification',onClick:()=>setNotice(null)},'×')));
  }
  hooks.addContent('SiteInfo_Top_TopRight', (site,status)=>React.createElement(SiteState,{key:'local-japanese-site-state',site,status}));
}
module.exports = { register, statusView };
