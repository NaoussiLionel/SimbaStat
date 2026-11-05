import { createHash, timingSafeEqual } from 'node:crypto'
import { get, put } from '@vercel/blob'

const blobPath = 'simba-stat/accounts.json'
const digest = value => createHash('sha256').update(value).digest('hex')
const tokenFrom = req => {
  const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('simba_session='))
  return cookie ? digest(decodeURIComponent(cookie.slice('simba_session='.length))) : null
}
async function readAccounts() {
  if (process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const result = await get(blobPath, { access: 'private', useCache: false })
      if (!result) return { users: [], sessions: [] }
      return JSON.parse((await new Response(result.stream).text()).replace(/^\uFEFF/, ''))
    } catch (error) {
      if (error?.statusCode === 404 || error?.status === 404) return { users: [], sessions: [] }
      throw error
    }
  }
  const fs = await import('node:fs/promises')
  try { return JSON.parse((await fs.readFile(new URL('../../../data/accounts.json', import.meta.url), 'utf8')).replace(/^\uFEFF/, '')) }
  catch (error) { if (error.code === 'ENOENT') return { users: [], sessions: [] }; throw error }
}
async function writeAccounts(db) {
  const payload = JSON.stringify(db, null, 2) + '\n'
  if (process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN) { await put(blobPath, payload, { access: 'private', allowOverwrite: true }); return }
  const fs = await import('node:fs/promises')
  const file = new URL('../../../data/accounts.json', import.meta.url)
  await fs.writeFile(file, payload, 'utf8')
}
export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const db = await readAccounts()
    const token = tokenFrom(req)
    const session = db.sessions.find(item => item.tokenHash === token && item.expiresAt > Date.now())
    if (!session) return res.status(401).json({ error: 'Not signed in' })
    db.users = db.users.filter(user => user.id !== session.userId)
    db.sessions = db.sessions.filter(item => item.userId !== session.userId)
    await writeAccounts(db)
    res.setHeader('set-cookie', 'simba_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')
    return res.status(200).json({ ok: true, message: 'Compte supprimé' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Impossible de supprimer le compte pour le moment.' })
  }
}
