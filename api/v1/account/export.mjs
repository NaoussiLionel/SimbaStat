import { createHash } from 'node:crypto'
import { get } from '@vercel/blob'

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
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const db = await readAccounts()
    const token = tokenFrom(req)
    const session = db.sessions.find(item => item.tokenHash === token && item.expiresAt > Date.now())
    const user = session && db.users.find(item => item.id === session.userId)
    if (!user) return res.status(401).json({ error: 'Not signed in' })
    res.setHeader('content-disposition', 'attachment; filename="simba-stat-personal-data.json"')
    return res.status(200).json({ account: { email: user.email, createdAt: user.createdAt }, preferences: user.preferences })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Impossible d’exporter les données pour le moment.' })
  }
}
