// EMPIRE Assistant — desktop shell (Electron)
// Loads the deployed EMPIRE voice+chat assistant in a native gold-themed window,
// auto-grants microphone for voice, EMPIRE brand chrome.
const { app, BrowserWindow, session, shell, Menu, globalShortcut } = require('electron');
const path = require('path');

const EMPIRE_URL = process.env.EMPIRE_URL || 'https://6-empires.com/chat';

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 440,
    height: 760,
    minWidth: 360,
    minHeight: 540,
    title: 'EMPIRE Assistant',
    backgroundColor: '#050402',
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, 'empire-logo.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Auto-allow microphone (for voice STT) — this app only loads the EMPIRE origin.
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    cb(permission === 'media' || permission === 'microphone' || permission === 'audioCapture');
  });

  win.loadURL(EMPIRE_URL);

  // External links open in the system browser, not inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(EMPIRE_URL)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
}

app.whenReady().then(() => {
  createWindow();

  // ⌘⇧Space — global show/hide toggle (like a quick-assistant)
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (!win) return createWindow();
    win.isVisible() && win.isFocused() ? win.hide() : (win.show(), win.focus());
  });

  const template = [
    { label: 'EMPIRE Assistant', submenu: [
      { role: 'about' }, { type: 'separator' },
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => win && win.reload() },
      { type: 'separator' }, { role: 'hide' }, { role: 'quit' }
    ]},
    { label: 'Edit', submenu: [
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
    ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
