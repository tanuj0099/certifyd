const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

let replacedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace #10b981 and #10B981 with var(--brand-primary)
  content = content.replace(/#10b981/gi, 'var(--brand-primary)');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    replacedCount++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Replaced in ${replacedCount} files.`);
