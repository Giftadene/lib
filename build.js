const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('Building NaijaLib for static production deployment...');

// Recreate dist directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy index.html
fs.copyFileSync(path.join(ROOT_DIR, 'index.html'), path.join(DIST_DIR, 'index.html'));

// Copy data/ directory
if (fs.existsSync(path.join(ROOT_DIR, 'data'))) {
  copyRecursive(path.join(ROOT_DIR, 'data'), path.join(DIST_DIR, 'data'));
}

// Copy js/ directory
if (fs.existsSync(path.join(ROOT_DIR, 'js'))) {
  copyRecursive(path.join(ROOT_DIR, 'js'), path.join(DIST_DIR, 'js'));
}

console.log('NaijaLib build successful! Production assets prepared in dist/');
