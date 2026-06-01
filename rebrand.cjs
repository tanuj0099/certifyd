const fs = require('fs');
const path = require('path');

const dirs = ['src', 'certifyroi-site', 'index.html'];
const exts = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.md'];

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const stat = fs.statSync(dir);
    if (stat.isFile()) return [dir];
    
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else { 
            if (exts.includes(path.extname(file))) {
                results.push(file);
            }
        }
    });
    return results;
}

let files = [];
dirs.forEach(d => {
    files = files.concat(walk(d));
});

let changedCount = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(/CertifyROI/g, 'Certify').replace(/CERTIFYROI/g, 'CERTIFY');
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Updated: ' + file);
        changedCount++;
    }
});
console.log('Total files updated: ' + changedCount);
