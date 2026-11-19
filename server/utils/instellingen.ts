import type { QuizInstellingen } from '#shared/types/quiz'
import { STANDAARD_INSTELLINGEN } from '#shared/utils/quiz'

type Rij = { meerdere_teams_per_vraag?: boolean | null, toon_vragen?: boolean | null, tussenstand_na_ronde?: boolean | null }

// Ontbrekende kolommen (migratie nog niet gedraaid) vallen terug op de standaardwaarden.
export function instellingenUitRij(rij: Rij): QuizInstellingen {
  return {
    meerdereTeamsPerVraag: rij.meerdere_teams_per_vraag ?? STANDAARD_INSTELLINGEN.meerdereTeamsPerVraag,
    toonVragen: rij.toon_vragen ?? STANDAARD_INSTELLINGEN.toonVragen,
    tussenstandNaRonde: rij.tussenstand_na_ronde ?? STANDAARD_INSTELLINGEN.tussenstandNaRonde
  }
}
