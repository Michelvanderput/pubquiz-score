import { STANDAARD_INSTELLINGEN } from '#shared/utils/quiz'
import { generateToken } from '../../utils/tokens'

// Is de gekozen code bezet, dan nemen we automatisch de volgende vrije.
function volgendeCode(basis: number, poging: number): string {
  return String((basis + poging) % 10000).padStart(4, '0')
}

export default defineEventHandler(async (event) => {
  const { naam, aantalRondes, quizcode: gekozenCode, meerdereTeamsPerVraag, toonVragen, tussenstandNaRonde } = await leesBody(event, maakQuizBody)
  const supabase = useSupabaseAdmin()

  let quiz: { id: string } | null = null
  let adminToken = ''
  let viewToken = ''
  let quizcode = ''
  let laatsteFout: { message: string } | null = null

  for (let poging = 0; poging < 30 && !quiz; poging++) {
    adminToken = generateToken(12)
    viewToken = generateToken(12)
    quizcode = volgendeCode(Number(gekozenCode), poging)
    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        naam,
        aantal_rondes: aantalRondes,
        admin_token: adminToken,
        view_token: viewToken,
        quizcode,
        meerdere_teams_per_vraag: meerdereTeamsPerVraag ?? STANDAARD_INSTELLINGEN.meerdereTeamsPerVraag,
        toon_vragen: toonVragen ?? STANDAARD_INSTELLINGEN.toonVragen,
        tussenstand_na_ronde: tussenstandNaRonde ?? STANDAARD_INSTELLINGEN.tussenstandNaRonde
      })
      .select('id')
      .single()
    if (!error && data) {
      quiz = data
      break
    }
    laatsteFout = error
    // 23505 = unique_violation (code of token bezet): opnieuw proberen.
    if (error?.code !== '23505') break
  }

  if (!quiz) {
    throw createError({ statusCode: 500, statusMessage: laatsteFout?.message ?? 'Kon quiz niet aanmaken' })
  }

  const rondes = Array.from({ length: aantalRondes }, (_, i) => ({ quiz_id: quiz.id, nummer: i + 1 }))
  const { error: rondesFout } = await supabase.from('rounds').insert(rondes)
  if (rondesFout) {
    await supabase.from('quizzes').delete().eq('id', quiz.id)
    throw createError({ statusCode: 500, statusMessage: rondesFout.message })
  }

  return { id: quiz.id, adminToken, viewToken, quizcode }
})
