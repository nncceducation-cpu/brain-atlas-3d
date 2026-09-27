const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const APP_ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.jsx': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.glb': 'model/gltf-binary', '.stl': 'model/stl',
  '.wasm': 'application/wasm', '.bin': 'application/octet-stream'
};

let server;

function startLocalServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const raw = decodeURIComponent((req.url || '/').split('?')[0]);
      const relative = raw === '/' ? 'index.html' : raw.replace(/^\/+/, '');
      const file = path.resolve(APP_ROOT, relative);
      if (!file.startsWith(APP_ROOT + path.sep)) {
        res.writeHead(403); res.end('Forbidden'); return;
      }
      fs.stat(file, (statErr, stat) => {
        if (statErr || !stat.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not found'); return;
        }
        res.writeHead(200, {
          'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff'
        });
        fs.createReadStream(file).pipe(res);
      });
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function createWindow() {
  const port = await startLocalServer();
  const win = new BrowserWindow({
    width: 1500, height: 960, minWidth: 980, minHeight: 680,
    title: 'Newborn Brain 3D', backgroundColor: '#d7e2e9',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  await win.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('before-quit', () => { if (server) server.close(); });
