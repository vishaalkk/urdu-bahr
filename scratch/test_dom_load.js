const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('src/manifest.json', 'utf8'));

let html = '';
manifest.body.forEach(f => {
  html += fs.readFileSync(f, 'utf8') + '\n';
});

const ids = new Set();
const idRegex = /id=["']([^"']+)["']/g;
let m;
while ((m = idRegex.exec(html)) !== null) {
  ids.add(m[1]);
}

console.log('Total IDs found in body HTML:', ids.size);

manifest.js.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const reg = /\$\(\s*['"]([^'"]+)['"]\s*\)/g;
  const missingInFile = new Set();
  while ((m = reg.exec(content)) !== null) {
    if (!ids.has(m[1])) {
      missingInFile.add(m[1]);
    }
  }
  if (missingInFile.size > 0) {
    console.log(file, 'references missing IDs:', Array.from(missingInFile));
  }
});
