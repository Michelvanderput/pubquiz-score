import type { QuizInstellingen, Ronde, Team, TeamStand, Vraag, VraagScore } from '../types/quiz'

export const MIN_TEAMGROOTTE = 3
export const MAX_TEAMGROOTTE = 4
export const STANDAARD_RONDES = 6
export const STANDAARD_INSTELLINGEN: QuizInstellingen = {
  meerdereTeamsPerVraag: true,
  toonVragen: false,
  tussenstandNaRonde: true
}

export function isGeldigeTeamgrootte(aantal: number): boolean {
  return Number.isInteger(aantal) && aantal >= MIN_TEAMGROOTTE && aantal <= MAX_TEAMGROOTTE
}

/**
 * Berekent de stand. Afgeronde rondes tellen mee in `totaal`; punten uit
 * lopende rondes staan apart in `live`, zodat het scorebord pas bij het
 * afronden van een ronde verspringt maar de zaal wel live kan meekijken.
 * Sortering: totaal, dan live, dan naam. Gelijke totalen delen een plek.
 */
export function berekenStand(
  teams: Pick<Team, 'id' | 'naam'>[],
  rondes: Pick<Ronde, 'id' | 'status'>[],
  vragen: Pick<Vraag, 'id' | 'round_id' | 'punten'>[],
  scores: Pick<VraagScore, 'question_id' | 'team_id'>[]
): TeamStand[] {
  const vraagInfo = new Map(vragen.map(v => [v.id, v]))
  const rondeStatus = new Map(rondes.map(r => [r.id, r.status]))

  const stand = new Map<string, TeamStand>(teams.map(t => [t.id, {
    teamId: t.id,
    naam: t.naam,
    perRonde: {},
    totaal: 0,
    live: 0,
    plek: 0
  }]))

  for (const score of scores) {
    const regel = stand.get(score.team_id)
    const vraag = vraagInfo.get(score.question_id)
    const status = vraag ? rondeStatus.get(vraag.round_id) : undefined
    if (!regel || !vraag || !status) continue

    regel.perRonde[vraag.round_id] = (regel.perRonde[vraag.round_id] ?? 0) + Number(vraag.punten)
    if (status === 'afgerond') regel.totaal += Number(vraag.punten)
    else regel.live += Number(vraag.punten)
  }

  const gesorteerd = [...stand.values()].sort((a, b) =>
    b.totaal - a.totaal || b.live - a.live || a.naam.localeCompare(b.naam, 'nl'))

  let vorige: TeamStand | undefined
  gesorteerd.forEach((regel, index) => {
    regel.plek = vorige && vorige.totaal === regel.totaal ? vorige.plek : index + 1
    vorige = regel
  })

  return gesorteerd
}

/** Houdt halve punten netjes: 3 → "3", 2.5 → "2,5". */
export function formatPunten(waarde: number): string {
  return Number.isInteger(waarde) ? String(waarde) : String(waarde).replace('.', ',')
}
