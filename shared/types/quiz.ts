export type RondeStatus = 'open' | 'afgerond'

export interface Speler {
  id: string
  naam: string
  team_id: string | null
}

export interface Team {
  id: string
  naam: string
}

export interface Vraag {
  id: string
  round_id: string
  volgorde: number
  tekst: string
  punten: number
}

export interface Ronde {
  id: string
  nummer: number
  titel: string | null
  status: RondeStatus
}

/** Eén rij = dit team heeft deze vraag goed. */
export interface VraagScore {
  question_id: string
  team_id: string
}

export interface TeamStand {
  teamId: string
  naam: string
  /** Punten per ronde-id (alleen rondes met punten of afgeronde rondes). */
  perRonde: Record<string, number>
  /** Totaal van afgeronde rondes: het officiële scorebord. */
  totaal: number
  /** Punten uit nog lopende rondes: live zichtbaar, telt nog niet mee. */
  live: number
  /** Gedeelde plekken bij gelijke stand (1, 2, 2, 4, ...). */
  plek: number
}

export interface QuizResponse {
  role: 'admin' | 'viewer'
  quiz: {
    id: string
    naam: string
    aantal_rondes: number
    quizcode: string | null
    admin_token?: string
    view_token: string
  }
  spelers: Speler[]
  teams: Team[]
  rondes: Ronde[]
  vragen: Vraag[]
  scores: VraagScore[]
  stand: TeamStand[]
}
