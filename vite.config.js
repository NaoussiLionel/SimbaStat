import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { handleApiRequest } from './api/server.mjs'

const root = path.dirname(fileURLToPath(import.meta.url))
const clubsRoot = path.join(root, 'clubs')

export default defineConfig({
  plugins: [simbaApi(), simbaClubAssets(), securityHeaders()],
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: Number(process.env.PORT || 8443),
    strictPort: true,
  },
  preview: {
    host: process.env.HOST || '0.0.0.0',
    port: Number(process.env.PORT || 8443),
  },
})

function simbaApi() {
  const attach = server => server.middlewares.use((req, res, next) => {
    if (!req.url?.startsWith('/api/')) return next()
    void handleApiRequest(req, res)
  })
  return {
    name: 'simba-api',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}

function simbaClubAssets() {
  const serve = (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method || 'GET')) return next()
    let pathname
    try { pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname) }
    catch { return next() }
    if (!pathname.startsWith('/clubs/')) return next()
    const target = path.resolve(root, `.${pathname}`)
    const relative = path.relative(clubsRoot, target)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return next()
    let info
    try { info = statSync(target) } catch { return next() }
    if (!info.isFile() || path.extname(target).toLowerCase() !== '.png') return next()
    res.statusCode = 200
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Length', info.size)
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    if (req.method === 'HEAD') return res.end()
    res.end(readFileSync(target))
  }
  const walk = (directory, files = []) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(fullPath, files)
      else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.png') files.push(fullPath)
    }
    return files
  }
  return {
    name: 'simba-club-assets',
    configureServer(server) { server.middlewares.use(serve) },
    configurePreviewServer(server) { server.middlewares.use(serve) },
    generateBundle() {
      for (const file of walk(clubsRoot)) {
        this.emitFile({
          type: 'asset',
          fileName: path.relative(root, file).split(path.sep).join('/'),
          source: readFileSync(file),
        })
      }
    },
  }
}

function securityHeaders() {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "manifest-src 'self'",
    "worker-src 'self'",
  ].join('; ')
  const apply = (_req, res, next) => {
    res.setHeader('Content-Security-Policy', csp)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    next()
  }
  return {
    name: 'simba-security-headers',
    configureServer(server) { server.middlewares.use(apply) },
    configurePreviewServer(server) { server.middlewares.use(apply) },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '_headers',
        source: `/*\n  Content-Security-Policy: ${csp}\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`,
      })
    },
  }
}
