const fs = require('fs');
const path = require('path');

function searchFiles(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.next') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath, pattern);
    } else {
      if (fullPath.endsWith('.png') || fullPath.endsWith('.jpg') || fullPath.endsWith('.svg')) continue;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (pattern.test(content)) {
          console.log(`Found in: ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((line, i) => {
            if (pattern.test(line)) console.log(`  Line ${i+1}: ${line.trim().substring(0, 100)}`);
          });
        }
      } catch(e) {}
    }
  }
}

searchFiles(process.cwd(), /(sk_test|knock.*key)/i);
