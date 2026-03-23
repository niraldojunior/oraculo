const fs = require('fs');
const path = 'c:/Users/niral/oraculo/src/data/importedInitiatives.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\"impactedSystemIds\": \[[^\]]*\]/g, '\"impactedSystemIds\": []');
fs.writeFileSync(path, content);
console.log('Cleanup complete');
