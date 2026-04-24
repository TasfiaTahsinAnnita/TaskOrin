const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('src', (filepath) => {
  if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    // Replace literal \${ with ${
    let newContent = content.split('\\${').join('${');
    if (content !== newContent) {
      fs.writeFileSync(filepath, newContent);
      console.log('Fixed:', filepath);
    }
  }
});
