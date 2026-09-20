const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (file.includes('transcript.jsonl')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const brainDir = 'C:\\Users\\niu\\.gemini\\antigravity\\brain\\d980d95b-81c8-413f-86da-24f9ae78e983';
try {
  const matches = walk(brainDir);
  console.log('Matches:', matches);
} catch (e) {
  console.error(e);
}
