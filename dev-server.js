const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function serveFile(req, res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      // If requesting a static asset (.js, .css, .png, etc.) that does not exist, return 404
      if (ext && ext !== '.html') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${path.basename(filePath)}`);
        return;
      }

      // Fallback to index.html for client-side routing if file not found
      const indexPath = path.join(ROOT_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexData);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, safePath);
  serveFile(req, res, filePath);
});

server.listen(PORT, () => {
  console.log('================================================================');
  console.log('  NaijaLib - 2026 Nigerian School Library System');
  console.log('  NERDC Secondary Classification & Resource Management');
  console.log('================================================================');
  console.log(`\n  Local Dev Server is running at:\n`);
  console.log(`  > http://localhost:${PORT}`);
  console.log(`  > http://127.0.0.1:${PORT}\n`);
  console.log('  Press Ctrl+C to stop the server.');
  console.log('================================================================\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = Number(PORT) + 1;
    console.warn(`Port ${PORT} is in use, retrying on port ${fallbackPort}...`);
    server.listen(fallbackPort);
  } else {
    console.error('Server error:', err);
  }
});
