const WebSocket = globalThis.WebSocket;
const http = require('http');

http.get('http://localhost:9222/json', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const target = list.find(t => t.type === 'page' && t.url.includes('index.html'));
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.addEventListener('open', () => {
      const testCode = `
        (() => {
          const report = {};
          
          // Switch to Devanagari
          document.getElementById('btnScriptDev').click();

          // 1. Ear tab
          report.earTab = {
            activeScript: window.currentScript,
            verse: document.querySelector('#earPanel .line').textContent.trim()
          };

          // 2. Meters (bahr) tab
          go('bahr');
          const meterVerse = document.querySelector('#allMeters .card div[style*="font-size: 13.5px"], #allMeters .card div[style*="font-size:13.5px"]');
          report.metersTab = {
            verse: meterVerse ? meterVerse.textContent.trim() : null
          };

          // 3. Exercises tab
          go('exercises');
          const exVerse = document.querySelector('#exDetailView .card div[style*="flex: 1"], #exDetailView .card div[style*="flex:1"]');
          report.exercisesTab = {
            verse: exVerse ? exVerse.textContent.trim() : null
          };

          // 4. Studio tab
          go('studio');
          const studioVerse = document.querySelector('#studioResults .card div[style*="border-top"]');
          report.studioTab = {
            verse: studioVerse ? studioVerse.textContent.trim() : null
          };

          // 5. Switch to Roman
          document.getElementById('btnScriptRo').click();
          report.afterRoman = {
            activeScript: window.currentScript,
            studioVerse: document.querySelector('#studioResults .card div[style*="border-top"]').textContent.trim(),
            earVerse: document.querySelector('#earPanel .line').textContent.trim()
          };

          return report;
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: testCode, returnByValue: true }
      }));
    });

    ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        console.log("FINAL MULTI-TAB RESULTS:", JSON.stringify(msg.result.result.value, null, 2));
        process.exit(0);
      }
    });
  });
});
