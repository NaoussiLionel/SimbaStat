export type MatchStatus = 'scheduled' | 'played' | 'postponed' | 'awaiting_confirmation' | 'projected'

export type League = {
  id: string
  slug: string
  name: string
  level: 1 | 2
  country: 'CMR'
}

export type EliteTwoData = {
  seasonId: string
  competition: { id: string; name: string; season: string; level: 2 }
  clubs: Array<{ id: string; name: string }>
  matches: Array<{
    id: string
    round: number
    date: string | null
    home: string
    away: string
    homeScore: number | null
    awayScore: number | null
    status: MatchStatus
    sourceUrl?: string | null
    verifiedAt?: string | null
  }>
  predictions?: Array<{ id: string; round: number; home: string; away: string; status: 'projected'; confidence: 'low' }>
}

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1'

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Simba API request failed (${response.status})`)
  return response.json() as Promise<T>
}

export const simbaApi = {
  competitions: () => get<League[]>('/competitions'),
  eliteTwo: () => get<EliteTwoData>('/data/elite-two-2026-27'),
  matches: (seasonId: string, params: { round?: number; club?: string } = {}) => {
    const query = new URLSearchParams()
    if (params.round) query.set('round', String(params.round))
    if (params.club) query.set('club', params.club)
    return get<EliteTwoData['matches']>(`/seasons/${encodeURIComponent(seasonId)}/matches${query.size ? `?${query}` : ''}`)
  },
}
