import { describe, expect, it } from 'vitest'
import { berekenStand, formatPunten, isGeldigeTeamgrootte } from '#shared/utils/quiz'

const teams = [
  { id: 't1', naam: 'Brouwers' },
  { id: 't2', naam: 'Alles Kwijt' },
  { id: 't3', naam: 'Zonder Naam' }
]
const rondes = [
  { id: 'r1', status: 'afgerond' as const },
  { id: 'r2', status: 'open' as const }
]
const vragen = [
  { id: 'v1', round_id: 'r1', punten: 1 },
  { id: 'v2', round_id: 'r1', punten: 2 },
  { id: 'v3', round_id: 'r2', punten: 1 }
]

describe('isGeldigeTeamgrootte', () => {
  it('staat alleen 3 en 4 spelers toe', () => {
    expect([2, 3, 4, 5].map(isGeldigeTeamgrootte)).toEqual([false, true, true, false])
    expect(isGeldigeTeamgrootte(3.5)).toBe(false)
  })
})

describe('berekenStand', () => {
  it('telt afgeronde rondes mee in het totaal en lopende rondes als live', () => {
    const stand = berekenStand(teams, rondes, vragen, [
      { question_id: 'v1', team_id: 't1' },
      { question_id: 'v2', team_id: 't2' },
      { question_id: 'v3', team_id: 't1' }
    ])
    const t1 = stand.find(s => s.teamId === 't1')!
    expect(t1.totaal).toBe(1)
    expect(t1.live).toBe(1)
    expect(t1.perRonde).toEqual({ r1: 1, r2: 1 })
    expect(stand.map(s => s.teamId)).toEqual(['t2', 't1', 't3'])
  })

  it('laat meerdere teams punten krijgen voor dezelfde vraag', () => {
    const stand = berekenStand(teams, rondes, vragen, [
      { question_id: 'v1', team_id: 't1' },
      { question_id: 'v1', team_id: 't2' }
    ])
    expect(stand.find(s => s.teamId === 't1')!.totaal).toBe(1)
    expect(stand.find(s => s.teamId === 't2')!.totaal).toBe(1)
  })

  it('geeft gelijke totalen dezelfde plek en slaat de volgende over', () => {
    const stand = berekenStand(teams, rondes, vragen, [
      { question_id: 'v1', team_id: 't1' },
      { question_id: 'v1', team_id: 't2' }
    ])
    expect(stand.map(s => s.plek)).toEqual([1, 1, 3])
    // gelijk totaal: alfabetisch
    expect(stand.map(s => s.naam)).toEqual(['Alles Kwijt', 'Brouwers', 'Zonder Naam'])
  })

  it('negeert scores van onbekende teams of vragen', () => {
    const stand = berekenStand(teams, rondes, vragen, [
      { question_id: 'x', team_id: 't1' },
      { question_id: 'v1', team_id: 'onbekend' }
    ])
    expect(stand.every(s => s.totaal === 0 && s.live === 0)).toBe(true)
  })

  it('werkt zonder teams', () => {
    expect(berekenStand([], rondes, vragen, [])).toEqual([])
  })
})

describe('formatPunten', () => {
  it('toont halve punten met een komma', () => {
    expect(formatPunten(3)).toBe('3')
    expect(formatPunten(2.5)).toBe('2,5')
  })
})
