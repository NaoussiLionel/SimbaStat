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
const importAuditFile = path.resolve(here, '../data/import-audit.json')
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
  res.setHeader('x-content-type-options', 'nosniff')
  res.setHeader('x-frame-options', 'DENY')
  res.setHeader('referrer-policy', 'strict-origin-when-cross-origin')
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()')
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
async function writeJsonAtomically(file, value) {
  const temp = `${file}.tmp`
  await writeFile(temp, JSON.stringify(value, null, 2) + '\n', 'utf8')
  await rename(temp, file)
}
async function readImportAudit() {
  try { return JSON.parse((await readFile(importAuditFile, 'utf8')).replace(/^\uFEFF/, '')) }
  catch (error) { if (error.code === 'ENOENT') return []; throw error }
}
const digest = value => createHash('sha256').update(value).digest('hex')
const passwordHash = (password, salt) => new Promise((resolve, reject) => {
  scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key.toString('hex')))
})
const dummySalt = '0'.repeat(32)
const dummyPasswordHash = await passwordHash('Simba Stat invalid login', dummySalt)
const tokenFrom = req => {
  const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('simba_session='))
  return cookie ? digest(decodeURIComponent(cookie.slice('simba_session='.length))) : null
}
const sessionCookie = (req, value, maxAge = 2592000) => `simba_session=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`
const attempts = new Map()
let lastAttemptCleanup = 0
let accountWriteQueue = Promise.resolve()
let importWriteQueue = Promise.resolve()
function withAccountLock(operation) {
  const next = accountWriteQueue.then(operation, operation)
  accountWriteQueue = next.then(() => undefined, () => undefined)
  return next
}
function withImportLock(operation) {
  const next = importWriteQueue.then(operation, operation)
  importWriteQueue = next.then(() => undefined, () => undefined)
  return next
}
function clientAddress(req) {
  if (process.env.SIMBA_TRUST_PROXY === 'true') {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress || 'unknown'
}
function rateLimited(req) {
  const now = Date.now()
  if (now - lastAttemptCleanup > 60000) {
    for (const [key, entry] of attempts) if (now - entry.time > 900000) attempts.delete(key)
    lastAttemptCleanup = now
  }
  const entry = attempts.get(clientAddress(req))
  return !!entry && now - entry.time <= 900000 && entry.count >= 8
}
function failedAttempt(req) {
  const key = clientAddress(req), now = Date.now(), entry = attempts.get(key)
  if (!entry || now - entry.time > 900000) attempts.set(key, { time: now, count: 1 })
  else { entry.count++; entry.time = now }
}
function clearFailedAttempts(req) {
  attempts.delete(clientAddress(req))
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
      const input = await body(req) || {}, email = String(input.email || '').trim().toLowerCase(), password = String(input.password || '')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 200) {
        failedAttempt(req)
        return json(res, 400, { error: 'Impossible de créer le compte. Vérifiez les informations ou connectez-vous si vous avez déjà un compte.' })
      }
      const salt = randomBytes(16).toString('hex'), user = { id: randomBytes(16).toString('hex'), email, salt, passwordHash: await passwordHash(password, salt), preferences: cleanPreferences(input.preferences), createdAt: new Date().toISOString() }
      return withAccountLock(async () => {
        const db = await readAccounts()
        if (db.users.some(existing => existing.email === email)) {
          failedAttempt(req)
          return json(res, 400, { error: 'Impossible de créer le compte. Vérifiez les informations ou connectez-vous si vous avez déjà un compte.' })
        }
        const token = randomBytes(32).toString('base64url')
        db.users.push(user); db.sessions.push({ tokenHash: digest(token), userId: user.id, expiresAt: Date.now() + 2592000000 })
        await writeAccounts(db); clearFailedAttempts(req); res.setHeader('set-cookie', sessionCookie(req, token))
        return json(res, 201, { account: { email: user.email }, preferences: user.preferences, message: 'Compte créé' })
      })
    }

    if (url.pathname === `${prefix}/account/login` && req.method === 'POST') {
      if (rateLimited(req)) return json(res, 429, { error: 'Trop de tentatives. Réessayez dans quelques minutes.' })
      const input = await body(req) || {}, email = String(input.email || '').trim().toLowerCase(), suppliedPassword = String(input.password || ''), validInput = suppliedPassword.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      const password = suppliedPassword.slice(0, 200)
      return withAccountLock(async () => {
        const db = await readAccounts(), user = db.users.find(item => item.email === email)
        const candidate = Buffer.from(await passwordHash(password, user?.salt || dummySalt))
        const stored = /^[a-f0-9]{128}$/i.test(user?.passwordHash || '') ? Buffer.from(user.passwordHash) : Buffer.from(dummyPasswordHash)
        const matches = timingSafeEqual(candidate, stored)
        if (!validInput || !user || !matches) {
          failedAttempt(req)
          return json(res, 401, { error: 'Adresse e-mail ou mot de passe incorrect.' })
        }
        const token = randomBytes(32).toString('base64url'); db.sessions = db.sessions.filter(session => session.expiresAt > Date.now() && session.userId !== user.id); db.sessions.push({ tokenHash: digest(token), userId: user.id, expiresAt: Date.now() + 2592000000 })
        await writeAccounts(db); clearFailedAttempts(req); res.setHeader('set-cookie', sessionCookie(req, token))
        return json(res, 200, { account: { email: user.email }, preferences: user.preferences })
      })
    }

    if (url.pathname === `${prefix}/account/me` && req.method === 'GET') {
      const db = await readAccounts(), session = db.sessions.find(item => item.tokenHash === tokenFrom(req) && item.expiresAt > Date.now()), user = session && db.users.find(item => item.id === session.userId)
      return user ? json(res, 200, { account: { email: user.email }, preferences: user.preferences }) : json(res, 401, { error: 'Not signed in' })
    }

    if (url.pathname === `${prefix}/account/preferences` && req.method === 'PUT') {
      const input = await body(req) || {}, prefs = input.preferences || {}, token = tokenFrom(req)
      return withAccountLock(async () => {
        const db = await readAccounts(), session = db.sessions.find(item => item.tokenHash === token && item.expiresAt > Date.now()), user = session && db.users.find(item => item.id === session.userId)
        if (!user) return json(res, 401, { error: 'Not signed in' })
        user.preferences = cleanPreferences(prefs)
        await writeAccounts(db); return json(res, 200, { preferences: user.preferences })
      })
    }

    if (url.pathname === `${prefix}/account/logout` && req.method === 'POST') {
      const token = tokenFrom(req)
      return withAccountLock(async () => {
        const db = await readAccounts(); db.sessions = db.sessions.filter(item => item.tokenHash !== token); await writeAccounts(db)
        res.setHeader('set-cookie', sessionCookie(req, '', 0)); return json(res, 200, { ok: true })
      })
    }

    if (req.method === 'GET' && url.pathname === `${prefix}/competitions`) {
      return json(res, 200, [
        { id: 'elite-one', slug: 'elite-one', name: 'MTN Elite One', level: 1, country: 'CMR' },
        { id: 'elite-two', slug: 'elite-two', name: 'MTN Elite Two', level: 2, country: 'CMR' },
      ])
    }

    if (url.pathname === `${prefix}/admin/imports` && req.method === 'GET') {
      if (!process.env.SIMBA_ADMIN_API_KEY) return json(res, 503, { error: 'Admin updates are not configured' })
      if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' })
      const revisions = await readImportAudit()
      return json(res, 200, { revisions: revisions.slice(-50).reverse() })
    }

    const rollbackPath = new RegExp(`^${prefix}/admin/imports/([a-f0-9]{24})/rollback$`).exec(url.pathname)
    if (rollbackPath && req.method === 'POST') {
      if (!process.env.SIMBA_ADMIN_API_KEY) return json(res, 503, { error: 'Admin updates are not configured' })
      if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' })
      const rollbackInput = await body(req) || {}, reviewNote = rollbackInput.reviewNote || ''
      if (!String(reviewNote).trim()) return json(res, 400, { error: 'A reviewNote is required for rollback.' })
      return withImportLock(async () => {
      const audit = await readImportAudit(), sourceRevision = audit.find(item => item.id === rollbackPath[1] && item.status === 'applied')
      if (!sourceRevision) return json(res, 404, { error: 'Applied revision not found' })
      const data = await readData(), changed = []
      for (const change of sourceRevision.changes) {
        const current = data.matches.find(match => match.id === change.id)
        const after = change.after
        if (!current || current.homeScore !== after.homeScore || current.awayScore !== after.awayScore || current.status !== after.status || (current.sourceUrl || null) !== (after.sourceUrl || null) || (current.verifiedAt || null) !== (after.verifiedAt || null)) {
          return json(res, 409, { error: 'A newer update changed one or more matches. Review the current scores before rolling back.', matchId: change.id })
        }
      }
      const rolledBackAt = new Date().toISOString()
      for (const change of sourceRevision.changes) {
        const current = data.matches.find(match => match.id === change.id), before = { homeScore: current.homeScore, awayScore: current.awayScore, status: current.status, sourceUrl: current.sourceUrl || null, verifiedAt: current.verifiedAt || null }
        Object.assign(current, change.before)
        changed.push({ id: current.id, before, after: { homeScore: current.homeScore, awayScore: current.awayScore, status: current.status, sourceUrl: current.sourceUrl || null, verifiedAt: current.verifiedAt || null } })
      }
      const revision = { id: randomBytes(12).toString('hex'), status: 'pending', importedAt: rolledBackAt, rollbackOf: sourceRevision.id, checksum: digest(JSON.stringify(changed)), reviewNote: String(reviewNote).trim().slice(0, 500), changes: changed }
      audit.push(revision)
      await writeJsonAtomically(importAuditFile, audit)
      await writeJsonAtomically(dataFile, data)
      revision.status = 'applied'
      await writeJsonAtomically(importAuditFile, audit)
      return json(res, 200, { rolledBack: changed.length, revisionId: revision.id, rollbackOf: sourceRevision.id })
      })
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
      const club = url.searchParams.get('club')
      const matches = [...data.matches, ...(data.predictions || [])]
      return json(res, 200, matches.filter(m => (!Number.isInteger(round) || round <= 0 || m.round === round) && (!club || m.home === club || m.away === club)))
    }

    if (req.method === 'POST' && url.pathname === `${prefix}/admin/imports`) {
      if (!process.env.SIMBA_ADMIN_API_KEY) return json(res, 503, { error: 'Admin updates are not configured' })
      if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' })
      const input = await body(req) || {}
      if (!Array.isArray(input.matches) || !input.matches.length || input.matches.length > 100) return json(res, 400, { error: 'Provide between 1 and 100 match updates' })
      return withImportLock(async () => {
      const data = await readData()
      const clubIds = new Set(data.clubs.map(club => club.id)), seen = new Set(), prepared = []
      for (const update of input.matches) {
        if (!update || typeof update !== 'object' || Array.isArray(update)) return json(res, 400, { error: 'Each match update must be an object' })
        const current = data.matches.find(m => m.id === update.id), sourceUrl = String(update.sourceUrl || input.sourceUrl || '')
        let validSource = false
        try { const parsed = new URL(sourceUrl); validSource = parsed.protocol === 'https:' || parsed.protocol === 'http:' } catch {}
        if (!current || seen.has(update.id) || !clubIds.has(current.home) || !clubIds.has(current.away) || !Number.isInteger(update.homeScore) || !Number.isInteger(update.awayScore) || update.homeScore < 0 || update.awayScore < 0 || update.homeScore > 30 || update.awayScore > 30 || !validSource) {
          return json(res, 400, { error: `Invalid match update or source: ${String(update.id || '')}` })
        }
        seen.add(update.id)
        prepared.push({ current, update, sourceUrl })
      }
      const conflicts = prepared.filter(({ current, update }) => current.status === 'postponed' || (current.status === 'played' && (current.homeScore !== update.homeScore || current.awayScore !== update.awayScore)))
      if (conflicts.length && input.reviewConflicts !== true) return json(res, 409, { error: 'Conflicting confirmed scores need review before they can be changed.', conflicts: conflicts.map(({ current, update }) => ({ id: current.id, current: [current.homeScore, current.awayScore], incoming: [update.homeScore, update.awayScore] })), action: 'Repeat the import with reviewConflicts=true and a reviewNote after checking the source.' })
      if (conflicts.length && !String(input.reviewNote || '').trim()) return json(res, 400, { error: 'A reviewNote is required when approving changed confirmed scores.' })

      const verifiedAt = new Date().toISOString()
      const changes = prepared.map(({ current, update, sourceUrl }) => {
        const before = { homeScore: current.homeScore, awayScore: current.awayScore, status: current.status, sourceUrl: current.sourceUrl || null, verifiedAt: current.verifiedAt || null }
        Object.assign(current, { homeScore: update.homeScore, awayScore: update.awayScore, status: 'played', verifiedAt, sourceUrl })
        return { id: current.id, before, after: { homeScore: current.homeScore, awayScore: current.awayScore, status: current.status, sourceUrl, verifiedAt } }
      })
      const audit = await readImportAudit(), revision = { id: randomBytes(12).toString('hex'), status: 'pending', importedAt: verifiedAt, sourceUrl: String(input.sourceUrl || prepared[0].sourceUrl), checksum: digest(JSON.stringify(input.matches)), reviewNote: String(input.reviewNote || '').trim() || null, changes }
      audit.push(revision)
      await writeJsonAtomically(importAuditFile, audit)
      await writeJsonAtomically(dataFile, data)
      revision.status = 'applied'
      await writeJsonAtomically(importAuditFile, audit)
      return json(res, 200, { updated: changes.length, revisionId: revision.id, checksum: revision.checksum })
      })
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
