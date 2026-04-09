const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadExcelFile: () => ipcRenderer.invoke('load-excel-file'),
  readDropboxRecipes: () => ipcRenderer.invoke('read-dropbox-recipes'),
  writeDropboxRecipes: (data) => ipcRenderer.invoke('write-dropbox-recipes', data),
  saveFile: (filename, content) => ipcRenderer.invoke('save-file', filename, content),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (cb) => {
    ipcRenderer.removeAllListeners('update-available')
    ipcRenderer.on('update-available', (_, info) => cb(info))
  },
  onUpdateDownloaded: (cb) => {
    ipcRenderer.removeAllListeners('update-downloaded')
    ipcRenderer.on('update-downloaded', () => cb())
  },
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available')
    ipcRenderer.removeAllListeners('update-downloaded')
  },
})
