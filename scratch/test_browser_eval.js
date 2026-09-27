const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Build an accurate DOM element registry from HTML IDs
const idRegex = /id=["']([^"']+)["']/g;
const idsInHtml = new Set();
let m;
while ((m = idRegex.exec(html)) !== null) {
  idsInHtml.add(m[1]);
}

// Elements store
const domElements = {};
idsInHtml.forEach(id => {
  domElements[id] = {
    id,
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._classes.has(c)) this._classes.delete(c);
          else this._classes.add(c);
        } else if (force) {
          this._classes.add(c);
        } else {
          this._classes.delete(c);
        }
      }
    },
    style: {},
    setAttribute(k, v) { this[k] = v; },
    removeAttribute(k) { delete this[k]; },
    getAttribute(k) { return this[k] || null; },
    addEventListener() {},
    innerHTML: '',
    value: '',
    querySelectorAll() { return []; }
  };
});

let hash = '#/meter/learn';
const listeners = {};

const sandbox = {
  console: console,
  window: {
    addEventListener(evt, fn) {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    location: {
      get hash() { return hash; },
      set hash(val) {
        const oldVal = hash;
        hash = val;
        if (listeners['hashchange']) {
          listeners['hashchange'].forEach(fn => fn({ type: 'hashchange', oldURL: oldVal, newURL: val }));
        }
      },
      replace(val) { this.hash = val; }
    },
    scrollTo() {}
  },
  location: {
    get hash() { return hash; },
    set hash(val) { sandbox.window.location.hash = val; },
    replace(val) { this.hash = val; }
  },
  document: {
    getElementById(id) {
      return domElements[id] || null;
    },
    querySelectorAll(sel) {
      if (sel.includes('.tab-view')) {
        return Object.values(domElements).filter(el =>
          ['weight-section', 'meter-section', 'scan-section', 'ghazals-section', 'handbook-section', 'about-section', 'tap-section'].includes(el.id)
        );
      }
      return [];
    },
    addEventListener() {},
    title: ''
  },
  localStorage: {
    getItem() { return null; },
    setItem() {}
  },
  AudioContext: class {},
  webkitAudioContext: class {}
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;

vm.createContext(sandbox);

// Extract scripts and evaluate them in order
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let sMatch;
let scriptIdx = 0;
while ((sMatch = scriptRegex.exec(html)) !== null) {
  scriptIdx++;
  console.log(`Evaluating script ${scriptIdx}...`);
  try {
    vm.runInContext(sMatch[1], sandbox);
  } catch (err) {
    console.error(`ERROR IN SCRIPT ${scriptIdx}:`, err);
  }
}

console.log('--- Testing hash navigation to #/weight/drill ---');
sandbox.location.hash = '#/weight/drill';
console.log('weight-section display:', sandbox.document.getElementById('weight-section').style.display);
console.log('meter-section display:', sandbox.document.getElementById('meter-section').style.display);
console.log('weightPanelDrill display:', sandbox.document.getElementById('weightPanelDrill').style.display);

console.log('--- Testing hash navigation to #/meter/drill ---');
sandbox.location.hash = '#/meter/drill';
console.log('meter-section display:', sandbox.document.getElementById('meter-section').style.display);
console.log('meterPanelDrill display:', sandbox.document.getElementById('meterPanelDrill').style.display);

console.log('--- Testing hash navigation to #/scan ---');
sandbox.location.hash = '#/scan';
console.log('scan-section display:', sandbox.document.getElementById('scan-section').style.display);

console.log('--- Testing hash navigation to #/ghazals ---');
sandbox.location.hash = '#/ghazals';
console.log('ghazals-section display:', sandbox.document.getElementById('ghazals-section').style.display);

console.log('--- Testing hash navigation to #/about ---');
sandbox.location.hash = '#/about';
console.log('about-section display:', sandbox.document.getElementById('about-section').style.display);

console.log('--- Testing script switcher ---');
vm.runInContext("setScriptMode('hi')", sandbox);
console.log('Script mode after hi:', vm.runInContext('currentScript', sandbox));
vm.runInContext("setScriptMode('ro')", sandbox);
console.log('Script mode after ro:', vm.runInContext('currentScript', sandbox));
vm.runInContext("setScriptMode('ur')", sandbox);
console.log('Script mode after ur:', vm.runInContext('currentScript', sandbox));

console.log('--- Testing Settings Sheet open/close ---');
vm.runInContext('openSettings()', sandbox);
console.log('settingsSheet has on class:', sandbox.document.getElementById('settingsSheet').classList.contains('on'));
vm.runInContext('closeSettings()', sandbox);
console.log('settingsSheet has on class after close:', sandbox.document.getElementById('settingsSheet').classList.contains('on'));

