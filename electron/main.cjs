const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const fs = require('fs')
const os = require('os')

let win

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Scout Menu Creator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  // ── Auto-updater (production only) ───────────────────────────
  if (app.isPackaged) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = false

    autoUpdater.on('update-available', info => {
      win.webContents.send('update-available', { version: info.version })
    })
    autoUpdater.on('update-downloaded', () => {
      win.webContents.send('update-downloaded')
    })
    autoUpdater.on('error', err => {
      console.error('AutoUpdater error:', err.message)
    })

    // Throttled check: at most once per hour regardless of trigger source
    let lastUpdateCheck = 0
    const CHECK_THROTTLE = 60 * 60 * 1000
    function safeCheckForUpdates() {
      const now = Date.now()
      if (now - lastUpdateCheck < CHECK_THROTTLE) return
      lastUpdateCheck = now
      autoUpdater.checkForUpdates().catch(err => console.error('Update check failed:', err))
    }

    safeCheckForUpdates()                                    // on startup
    setInterval(safeCheckForUpdates, 4 * 60 * 60 * 1000)   // every 4 hours
    win.on('focus', safeCheckForUpdates)                    // when user returns to app
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: install update ───────────────────────────────────────
ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(true, true)
})

// ── IPC: load Excel file ──────────────────────────────────────
ipcMain.handle('load-excel-file', async () => {
  const excelPath = app.isPackaged
    ? path.join(process.resourcesPath, 'Menu Template.xlsx')
    : path.join(__dirname, '../public/Menu Template.xlsx')

  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found at: ${excelPath}`)
  }
  const buf = fs.readFileSync(excelPath)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
})

// ── IPC: Dropbox recipes read ─────────────────────────────────
ipcMain.handle('read-dropbox-recipes', () => {
  const dropboxPath = path.join(os.homedir(), 'Dropbox', 'Scout Group', 'recipes.json')
  if (!fs.existsSync(dropboxPath)) return null
  try {
    return JSON.parse(fs.readFileSync(dropboxPath, 'utf-8'))
  } catch {
    return null
  }
})

// ── IPC: Dropbox recipes write ────────────────────────────────
ipcMain.handle('write-dropbox-recipes', (_, data) => {
  if (typeof data !== 'object' || data === null) return
  try {
    const dir = path.join(os.homedir(), 'Dropbox', 'Scout Group')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'recipes.json'), JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('write-dropbox-recipes error:', err)
  }
})

// ── IPC: native save dialog ───────────────────────────────────
ipcMain.handle('save-file', async (_, filename, content) => {
  const { filePath, canceled } = await dialog.showSaveDialog(win, {
    defaultPath: filename,
    filters: [
      { name: 'CSV', extensions: ['csv'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (!canceled && filePath) {
    fs.writeFileSync(filePath, content, 'utf-8')
    return filePath
  }
  return null
})
