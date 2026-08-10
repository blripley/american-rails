import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = process.cwd();
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpeg':'image/jpeg', '.json':'application/json' };
http.createServer(async (req,res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const full = normalize(join(root, p));
    if (!full.startsWith(root)) { res.writeHead(403); return res.end('no'); }
    const data = await readFile(full);
    res.writeHead(200, { 'Content-Type': types[extname(full)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(5177, () => console.log('serving on http://localhost:5177'));
