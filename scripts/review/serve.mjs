// Static server with Range support: python's http.server has none, and Chrome
// cannot scrub a 20 MB all-intra file it is not allowed to seek inside.
import { createServer } from 'node:http';
import { statSync, createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const [,, port = '4716', root = process.cwd()] = process.argv;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.md': 'text/markdown' };
createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(root, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404); res.end('404'); return; }
  const size = statSync(file).size, type = types[extname(file)] || 'application/octet-stream';
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    const start = range[1] ? +range[1] : 0, end = range[2] ? Math.min(+range[2], size - 1) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    createReadStream(file).pipe(res);
  }
}).listen(+port, '127.0.0.1', () => console.log('range server on', port, root));
