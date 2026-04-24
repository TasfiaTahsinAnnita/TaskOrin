const fs = require('fs');
const files = ['src/store/useWorkStore.ts', 'src/pages/TablePage.tsx', 'src/pages/ProjectsPage.tsx', 'src/pages/BoardPage.tsx'];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\`/g, '`');
  fs.writeFileSync(f, content);
});
