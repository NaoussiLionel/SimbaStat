import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const dataFile = path.resolve(here, '../data/elite-two-2026-27.json')
const lineupsFile = path.resolve(here, '../data/elite-one-2026-27-lineups.json')
const directoryFile = path.resolve(here, '../data/club-directory-elite-one-2026-27.json')
const accountsFile = path.resolve(here, '../data/accounts.json')
try {
  const envText = await readFile(path.resolve(here, '../.env'), 'utf8')
  for (const line of envText.split(/\r?\n/)) {
    const entry = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (entry && process.env[entry[1]] === undefined) process.env[entry[1]] = entry[2].replace(/^(?:"(.*)"|'(.*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted)
  }
} catch (error) { if (error.code !== 'ENOENT') throw error }
const port = Number(process.env.SIMBA_API_PORT || 3000)
const prefix = '/api/v1'

const json = (res, status, value, cacheControl = 'no-store') => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': cacheControl })
  res.end(JSON.stringify(value))
}

async function readData() {
  return JSON.parse((await readFile(dataFile, 'utf8')).replace(/^\uFEFF/, ''))
}
async function readJsonFile(file) {
  return JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''))
}

async function readAccounts() {
  try { return JSON.parse((await readFile(accountsFile, 'utf8')).replace(/^\uFEFF/, '')) }
  catch (error) { if (error.code === 'ENOENT') return { users: [], sessions: [] }; throw error }
}
async function writeAccounts(db) {
  const temp = `${accountsFile}.tmp`
  await writeFile(temp, JSON.stringify(db, null, 2) + '\n', 'utf8')
  await rename(temp, accountsFile)
}
const digest = value => createHash('sha256').update(value).digest('hex')
const passwordHash = (password, salt) => new Promise((resolve, reject) => {
  scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key.toString('hex')))
})
const tokenFrom = req => {
  const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('simba_session='))
  return cookie ? digest(decodeURIComponent(cookie.slice('simba_session='.length))) : null
}
const sessionCookie = (req, value, maxAge = 2592000) => `simba_session=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`
const attempts = new Map()
function rateLimited(req) {
  const key = req.socket.remoteAddress || 'unknown', now = Date.now(), entry = attempts.get(key)
  if (!entry || now - entry.time > 900000) { attempts.set(key, { time: now, count: 1 }); return false }
  return ++entry.count > 8
}
function cleanPreferences(value = {}) {
  if (!value || typeof value !== 'object') value = {}
  return {
    followed: Array.isArray(value.followed) ? value.followed.filter(x => typeof x === 'string').slice(0, 30) : [],
    alerts: Array.isArray(value.alerts) ? value.alerts.filter(x => ['elite-one', 'elite-two'].includes(x)) : [],
    savedEvents: Array.isArray(value.savedEvents) ? value.savedEvents.filter(x => typeof x === 'string').slice(0, 100) : [],
    matchAlerts: Array.isArray(value.matchAlerts) ? value.matchAlerts.filter(x => typeof x === 'string').slice(0, 100) : [],
    notifications: value.notifications === true,
  }
}

function authorized(req) {
  const expected = process.env.SIMBA_ADMIN_API_KEY
  const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, '') || ''
  if (!expected || !supplied) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(supplied)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function body(req) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 100_000) throw new Error('Request body too large')
  }
  return JSON.parse(raw || '{}')
}

export async function handleApiRequest(req, res) {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,authorization' })
      return res.end()
    }

    if (url.pathname === `${prefix}/account/register` && req.method === 'POST') {
      if (rateLimited(req)) return json(res, 429, { error: 'Trop de tentatives. Réessayez dans quelques minutes.' })
      const input = await body(req), email = String(input.email || '').trim().toLowerCase(), password = String(input.password || '')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 200) return json(res, 400, { error: 'Vérifiez votre adresse e-mail et choisissez un mot de passe de 12 caractères minimum.' })
      const db = await readAccounts()
      if (db.users.some(user => user.email === email)) return json(res, 409, { error: 'Un compte existe déjà avec cette adresse e-mail.' })
      const salt = randomBytes(16).toString('hex'), user = { id: randomBytes(16).toString('hex'), email, salt, passwordHash: await passwordHash(password, salt), preferences: cleanPreferences(input.preferences), createdAt: new Date().toISOString() }
      const token = randomBytes(32).toString('base64url')
      db.users.push(user); db.sessions.push({ tokenHash: digest(token), userId: user.id, expiresAt: Date.now() + 2592000000 })
      await writeAccounts(db); res.setHeader('set-cookie', sessionCookie(req, token))
      return json(res, 201, { account: { email: user.email }, preferences: user.preferences, message: 'Compte créé' })
    }

    if (url.pathname === `${prefix}/account/login` && req.method === 'POST') {
      if (rateLimited(req)) return json(res, 429, { error: 'Trop de tentatives. Réessayez dans quelques minutes.' })
      const input = await body(req), email = String(input.email || '').trim().toLowerCase(), password = String(input.password || ''), db = await readAccounts()
      const user = db.users.find(item => item.email === email)
      if (!user || !timingSafeEqual(Buffer.from(await passwordHash(password, user.salt)), Buffer.from(user.passwordHash))) return json(res, 401, { error: 'Adresse e-mail ou mot de passe incorrect.' })
      const token = randomBytes(32).toString('base64url'); db.sessions = db.sessions.filter(session => session.expiresAt > Date.now() && session.userId !== user.id); db.sessions.push({ tokenHash: digest(token), userId: user.id, expiresAt: Date.now() + 2592000000 })
      await writeAccounts(db); res.setHeader('set-cookie', sessionCookie(req, token))
      return json(res, 200, { account: { email: user.email }, preferences: user.preferences })
    }

    if (url.pathname === `${prefix}/account/me` && req.method === 'GET') {
      const db = await readAccounts(), session = db.sessions.find(item => item.tokenHash === tokenFrom(req) && item.expiresAt > Date.now()), user = session && db.users.find(item => item.id === session.userId)
      return user ? json(res, 200, { account: { email: user.email }, preferences: user.preferences }) : json(res, 401, { error: 'Not signed in' })
    }

    if (url.pathname === `${prefix}/account/preferences` && req.method === 'PUT') {
      const db = await readAccounts(), session = db.sessions.find(item => item.tokenHash === tokenFrom(req) && item.expiresAt > Date.now()), user = session && db.users.find(item => item.id === session.userId)
      if (!user) return json(res, 401, { error: 'Not signed in' })
      const input = await body(req), prefs = input.preferences || {}
      user.preferences = cleanPreferences(prefs)
      await writeAccounts(db); return json(res, 200, { preferences: user.preferences })
    }

    if (url.pathname === `${prefix}/account/logout` && req.method === 'POST') {
      const db = await readAccounts(), token = tokenFrom(req); db.sessions = db.sessions.filter(item => item.tokenHash !== token); await writeAccounts(db)
      res.setHeader('set-cookie', sessionCookie(req, '', 0)); return json(res, 200, { ok: true })
    }

    if (req.method === 'GET' && url.pathname === `${prefix}/competitions`) {
      return json(res, 200, [
        { id: 'elite-one', slug: 'elite-one', name: 'MTN Elite One', level: 1, country: 'CMR' },
        { id: 'elite-two', slug: 'elite-two', name: 'MTN Elite Two', level: 2, country: 'CMR' },
      ])
    }

    if (req.method === 'GET' && url.pathname === `${prefix}/data/elite-two-2026-27`) {
      return json(res, 200, await readData(), 'public, max-age=300')
    }

    if (req.method === 'GET' && url.pathname === `${prefix}/seasons/elite-one-2026-27/lineups`) {
      return json(res, 200, await readJsonFile(lineupsFile), 'public, max-age=300')
    }

    if (req.method === 'GET' && url.pathname === `${prefix}/seasons/elite-one-2026-27/club-directory`) {
      return json(res, 200, await readJsonFile(directoryFile), 'public, max-age=300')
    }

    if (req.method === 'GET' && url.pathname === `${prefix}/seasons/elite-two-2026-27/matches`) {
      const data = await readData()
      const round = Number(url.searchParams.get('round'))
      const matches = [...data.matches, ...(data.predictions || [])]
      return json(res, 200, Number.isInteger(round) && round > 0 ? matches.filter(m => m.round === round) : matches)
    }

    if (req.method === 'POST' && url.pathname === `${prefix}/admin/imports`) {
      if (!process.env.SIMBA_ADMIN_API_KEY) return json(res, 503, { error: 'Admin updates are not configured' })
      if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' })
      const input = await body(req)
      if (!Array.isArray(input.matches) || !input.matches.length) return json(res, 400, { error: 'Expected a non-empty matches array' })
      const data = await readData()
      for (const update of input.matches) {
        const current = data.matches.find(m => m.id === update.id)
        if (!current || !Number.isInteger(update.homeScore) || !Number.isInteger(update.awayScore) || update.homeScore < 0 || update.awayScore < 0) {
          return json(res, 400, { error: `Invalid or unknown match: ${String(update.id || '')}` })
        }
        current.homeScore = update.homeScore
        current.awayScore = update.awayScore
        current.status = 'played'
        current.verifiedAt = new Date().toISOString()
        current.sourceUrl = typeof update.sourceUrl === 'string' ? update.sourceUrl : null
      }
      const tempFile = `${dataFile}.tmp`
      await writeFile(tempFile, JSON.stringify(data, null, 2) + '\n', 'utf8')
      await rename(tempFile, dataFile)
      return json(res, 200, { updated: input.matches.length })
    }

    return json(res, 404, { error: 'Not found' })
  } catch (error) {
    return json(res, error instanceof SyntaxError ? 400 : 500, { error: error instanceof SyntaxError ? 'Invalid JSON' : 'Request failed' })
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createServer(handleApiRequest)
  server.listen(port, '127.0.0.1', () => {
    console.log(`Simba API listening on http://127.0.0.1:${port}${prefix}`)
  })
  server.on('error', error => {
    if (error.code === 'EADDRINUSE') console.log(`Simba API already listening on 127.0.0.1:${port}`)
    else console.error('Simba API failed to start:', error)
  })
}
