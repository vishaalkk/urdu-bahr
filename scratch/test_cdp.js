const WebSocket = globalThis.WebSocket;
const http = require('http');

http.get('http://localhost:9222/json', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const target = list.find(t => t.type === 'page' && t.url.includes('index.html'));
    if (!target) {
      console.log('No matching page target found');
      process.exit(1);
    }
    console.log('Connecting to:', target.webSocketDebuggerUrl);
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
      const expr = `
        (() => {
          const report = {};
          report.btnUrdu = !!document.getElementById('btnScriptUrdu');
          report.btnDev = !!document.getElementById('btnScriptDev');
          report.btnRo = !!document.getElementById('btnScriptRo');
          report.btnAscii = !!document.getElementById('btnScriptAscii');
          
          // Test clicking Dev
          const bDev = document.getElementById('btnScriptDev');
          if (bDev) {
            try {
              bDev.click();
              report.afterClickDev = {
                currentScript: window.currentScript,
                classes: bDev.className
              };
            } catch(e) {
              report.clickError = e.toString() + ' ' + e.stack;
            }
          }

          // Test clicking nav buttons
          const navBtns = [...document.querySelectorAll('#nav button')].map(b => ({
            id: b.dataset.s,
            text: b.textContent.trim(),
            rect: b.getBoundingClientRect()
          }));
          report.navBtns = navBtns;

          // Test clicking handbook
          const hbBtn = document.querySelector('button[data-s="handbook"]');
          if (hbBtn) {
            try {
              hbBtn.click();
              report.afterHbClick = {
                handbookOn: document.getElementById('handbook').classList.contains('on'),
                hbChipsCount: document.querySelectorAll('#hbChapterChips button').length
              };
            } catch(e) {
              report.hbClickError = e.toString();
            }
          }

          // Check if any element overlaps header buttons
          if (bDev) {
            const rect = bDev.getBoundingClientRect();
            report.bDevRect = rect;
            const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
            report.elementAtPoint = topEl ? { tag: topEl.tagName, id: topEl.id, class: topEl.className } : null;
          }

          return report;
        })()
      `;

      ws.send(JSON.stringify({
        id: 3,
        method: 'Runtime.evaluate',
        params: { expression: expr, returnByValue: true }
      }));
    });

    ws.addEventListener('message', evt => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION IN BROWSER:', JSON.stringify(msg.params, null, 2));
      }
      if (msg.id === 3) {
        console.log('EVALUATION REPORT:', JSON.stringify(msg.result, null, 2));
        ws.close();
        process.exit(0);
      }
    });
  });
});
