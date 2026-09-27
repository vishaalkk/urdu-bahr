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
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.reload' }));
      setTimeout(() => {
        const testCode = `
          (() => {
            const results = {};
            // Initial state (should be Ear tab, Urdu script)
            const earLine = document.querySelector('#earPanel .line');
            results.initialVerse = earLine ? earLine.textContent.trim() : null;
            results.initialUrduBtnOn = document.getElementById('btnScriptUrdu').classList.contains('on');
            
            // 1. Click Devanagari
            document.getElementById('btnScriptDev').click();
            results.afterDevClick = {
              devBtnOn: document.getElementById('btnScriptDev').classList.contains('on'),
              urduBtnOn: document.getElementById('btnScriptUrdu').classList.contains('on'),
              verse: document.querySelector('#earPanel .line').textContent.trim(),
              firstFamChip: document.querySelector('#earFams .fchip').textContent.trim()
            };

            // 2. Click Roman
            document.getElementById('btnScriptRo').click();
            results.afterRoClick = {
              roBtnOn: document.getElementById('btnScriptRo').classList.contains('on'),
              verse: document.querySelector('#earPanel .line').textContent.trim(),
              firstFamChip: document.querySelector('#earFams .fchip').textContent.trim()
            };

            // 3. Click ASCII
            document.getElementById('btnScriptAscii').click();
            results.afterAsciiClick = {
              asciiBtnOn: document.getElementById('btnScriptAscii').classList.contains('on'),
              verse: document.querySelector('#earPanel .line').textContent.trim(),
              firstFamChip: document.querySelector('#earFams .fchip').textContent.trim()
            };

            // 4. Click Urdu back
            document.getElementById('btnScriptUrdu').click();
            results.afterUrduClick = {
              urduBtnOn: document.getElementById('btnScriptUrdu').classList.contains('on'),
              verse: document.querySelector('#earPanel .line').textContent.trim(),
              firstFamChip: document.querySelector('#earFams .fchip').textContent.trim()
            };

            return results;
          })()
        `;
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: { expression: testCode, returnByValue: true }
        }));
      }, 1000);
    });

    ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.id === 2) {
        console.log("TEST RESULTS:", JSON.stringify(msg.result.result.value, null, 2));
        process.exit(0);
      }
    });
  });
});
