'use strict';
const http = require('http');
// Probe the Local router directly, while preserving the site's Host header.
// No external requests, credentials, automatic redirects or certificate bypass.
function probe(domain, port = 80) {
  return new Promise(resolve => {
    let settled = false;
    const finish = result => { if (!settled) { settled = true; clearTimeout(deadline); resolve(result); } };
    const req = http.get({hostname: '127.0.0.1', port, path: '/', headers: {Host: domain, 'User-Agent': 'LocalJapanese-Readiness/1.0', 'Cache-Control': 'no-cache'}}, res => {
      let size = 0;
      const success = res.statusCode >= 200 && res.statusCode < 300;
      res.on('data', chunk => { size += chunk.length; if (size >= 65536) { finish({ready: success, status: res.statusCode, reason: success ? '' : 'HTTP ' + res.statusCode}); res.destroy(); } });
      res.on('end', () => finish({ready: success && size > 0, status: res.statusCode, reason: success && size > 0 ? '' : 'HTTP ' + res.statusCode + (size ? '' : ' / empty response')}));
      res.on('error', () => finish({ready:false, reason:'Response interrupted'}));
    });
    const deadline = setTimeout(() => { finish({ready:false, reason:'Timeout'}); req.destroy(); }, 5000);
    req.on('error', () => finish({ready:false, reason:'Connection failed'}));
  });
}
module.exports = {probe};
