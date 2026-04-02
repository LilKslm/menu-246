import fs from 'fs'
import path from 'path'
import https from 'https'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOKEN = 'nfc_XNZt2SapHZHNX4TeyJ5zVMz1SKH39jdVa576'
const SITE_ID = '6c3762a4-59e2-4753-a476-e764924c8310'

function getAllFiles(dir, base = dir) {
  const files = {}
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Skip Office temp files (e.g. ~$Menu Template.xlsx)
    if (entry.name.startsWith('~$')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      Object.assign(files, getAllFiles(full, base))
    } else {
      const rel = '/' + full.slice(base.length + 1).split(path.sep).join('/')
      const content = fs.readFileSync(full)
      const hash = crypto.createHash('sha1').update(content).digest('hex')
      files[rel] = hash
    }
  }
  return files
}

function apiRequest(method, urlPath, body, isBinary = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1${urlPath}`,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        ...(body && !isBinary ? { 'Content-Type': 'application/json' } : {}),
        ...(isBinary ? { 'Content-Type': 'application/octet-stream' } : {}),
      }
    }
    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString()
        try { resolve(JSON.parse(text)) } catch { resolve(text) }
      })
    })
    req.on('error', reject)
    if (body) req.write(isBinary ? body : JSON.stringify(body))
    req.end()
  })
}

const distDir = path.join(__dirname, 'dist')
const fileMap = getAllFiles(distDir)
console.log(`Found ${Object.keys(fileMap).length} files`)

// Step 1: Create deploy
console.log('Creating deploy...')
const deploy = await apiRequest('POST', `/sites/${SITE_ID}/deploys`, { files: fileMap, draft: true })

if (!deploy.id) {
  console.error('Failed to create deploy:', JSON.stringify(deploy))
  process.exit(1)
}

console.log('Deploy ID:', deploy.id)
console.log('Required files:', deploy.required?.length || 0)

// Step 2: Upload required files
const required = deploy.required || []
for (const hash of required) {
  // Find file with this hash
  const rel = Object.keys(fileMap).find(k => fileMap[k] === hash)
  if (!rel) { console.warn('Could not find file for hash', hash); continue }
  const filePath = path.join(distDir, rel.replace(/^\//, '').split('/').join(path.sep))
  const content = fs.readFileSync(filePath)
  console.log(`Uploading ${rel} (${content.length} bytes)...`)
  const encodedRel = rel.split('/').map(s => encodeURIComponent(s)).join('/')
  await apiRequest('PUT', `/deploys/${deploy.id}/files${encodedRel}`, content, true)
}

console.log('\nDraft deploy complete!')
console.log('Preview URL:', deploy.deploy_ssl_url || deploy.deploy_url || `https://${deploy.subdomain}.netlify.app`)
