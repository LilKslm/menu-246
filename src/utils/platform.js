export const isElectron = typeof window !== 'undefined' && !!window.electronAPI

/**
 * Reads recipes.json from ~/Dropbox/Scout Group/ (Electron only).
 * Returns null in browser mode or if the file doesn't exist.
 */
export async function readDropboxRecipes() {
  if (!isElectron) return null
  try {
    return await window.electronAPI.readDropboxRecipes()
  } catch {
    return null
  }
}

/**
 * Writes recipes to ~/Dropbox/Scout Group/recipes.json (Electron only).
 */
export async function writeDropboxRecipes(data) {
  if (!isElectron) return
  try {
    await window.electronAPI.writeDropboxRecipes(data)
  } catch (err) {
    console.error('Failed to write Dropbox recipes:', err)
  }
}

/**
 * Downloads a file.
 * In Electron: opens a native save dialog.
 * In browser: creates a temporary anchor element.
 */
export function downloadFile(filename, content, mimeType = 'text/plain') {
  if (isElectron) {
    window.electronAPI.saveFile(filename, content).catch(console.error)
  } else {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
}
