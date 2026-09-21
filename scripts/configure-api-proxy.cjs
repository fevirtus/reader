const fs = require('node:fs')
const path = require('node:path')

// Next serializes rewrites at build time. Resolve the API destination again
// before the standalone server loads its manifest so one image works everywhere.
function configureApiProxy(root, origin) {
  const apiOrigin = origin.replace(/\/+$/, '')
  const url = new URL(apiOrigin)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('READER_API_ORIGIN must be an HTTP(S) URL')
  }
  const file = path.join(root, '.next/routes-manifest.json')
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
  const sources = new Set([
    '/api/genres', '/api/novels/:path*', '/api/chapters/:path*',
    '/api/auth/mobile-login', '/api/health', '/api/dev/:path*',
  ])
  const groups = Array.isArray(manifest.rewrites)
    ? [manifest.rewrites]
    : Object.values(manifest.rewrites || {})
  for (const rules of groups) {
    for (const rule of rules) {
      if (sources.has(rule.source)) rule.destination = apiOrigin + rule.source
    }
  }
  fs.writeFileSync(file, JSON.stringify(manifest))
}

if (require.main === module) {
  configureApiProxy(process.cwd(), process.env.READER_API_ORIGIN || 'http://localhost:8000')
}
module.exports = { configureApiProxy }
