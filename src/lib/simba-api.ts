export type MatchStatus = 'scheduled' | 'played' | 'postponed' | 'awaiting_confirmation'

export type League = {
  id: string
  slug: string
  name: string
  level: 1 | 2
  country: 'CMR'
}

export type Season = {
  id: string
  leagueId: string
  label: string
  startsAt: string | null
  endsAt: string | null
  status: 'upcoming' | 'active' | 'complete'
}

export type Match = {
  id: string
  seasonId: string
  round: number
  kickoff: string | null
  homeClubId: string
  awayClubId: string
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  venue: string | null
  sourceIds: string[]
}

export type Standing = {
  clubId: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  form: Array<'W' | 'D' | 'L' | null>
}

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')

async function get<T>(path: string): Promise<T> {
  if (!apiBase) throw new Error('VITE_API_BASE_URL is not configured')
  const response = await fetch(`${apiBase}${path}`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Simba API request failed (${response.status})`)
  return response.json() as Promise<T>
}

export const simbaApi = {
  leagues: () => get<League[]>('/competitions'),
  seasons: (leagueId: string) => get<Season[]>(`/competitions/${encodeURIComponent(leagueId)}/seasons`),
  standings: (seasonId: string) => get<Standing[]>(`/seasons/${encodeURIComponent(seasonId)}/standings`),
  matches: (seasonId: string, params: { round?: number; clubId?: string } = {}) => {
    const query = new URLSearchParams()
    if (params.round) query.set('round', String(params.round))
    if (params.clubId) query.set('club', params.clubId)
    return get<Match[]>(`/seasons/${encodeURIComponent(seasonId)}/matches${query.size ? `?${query}` : ''}`)
  },
}
