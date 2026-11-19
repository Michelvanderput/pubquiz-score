import { berekenStand } from '#shared/utils/quiz'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { quiz, role } = await requireQuizAccess(event, id, getQuery(event).token as string | undefined)
  const supabase = useSupabaseAdmin()

  const [spelers, teams, rondes, vragen, scores] = await Promise.all([
    supabase.from('players').select('id, naam, team_id').eq('quiz_id', quiz.id).order('created_at'),
    supabase.from('teams').select('id, naam').eq('quiz_id', quiz.id).order('created_at'),
    supabase.from('rounds').select('id, nummer, titel, status').eq('quiz_id', quiz.id).order('nummer'),
    supabase.from('questions').select('id, round_id, volgorde, tekst, punten').eq('quiz_id', quiz.id).order('volgorde').order('created_at'),
    supabase.from('question_scores').select('question_id, team_id').eq('quiz_id', quiz.id)
  ])
  const fout = [spelers, teams, rondes, vragen, scores].find(r => r.error)?.error
  if (fout) throw createError({ statusCode: 500, statusMessage: fout.message })

  const instellingen = instellingenUitRij(quiz)
  const alleVragen = (vragen.data ?? []).map(v => ({ ...v, punten: Number(v.punten) }))

  return {
    role,
    quiz: {
      id: quiz.id,
      naam: quiz.naam,
      aantal_rondes: quiz.aantal_rondes,
      quizcode: quiz.quizcode,
      instellingen,
      view_token: quiz.view_token,
      // Alleen de organisator krijgt het admin-token terug.
      ...(role === 'admin' ? { admin_token: quiz.admin_token } : {})
    },
    spelers: spelers.data ?? [],
    teams: teams.data ?? [],
    rondes: rondes.data ?? [],
    // Kijkers zien de vraagteksten alleen als de organisator dat aanzet, en dan
    // alleen van lopende rondes (afgeronde en toekomstige blijven verborgen).
    vragen: role === 'admin'
      ? alleVragen
      : alleVragen.map((v) => {
          const open = (rondes.data ?? []).find(r => r.id === v.round_id)?.status === 'open'
          return instellingen.toonVragen && open ? v : { ...v, tekst: '' }
        }),
    scores: scores.data ?? [],
    stand: berekenStand(teams.data ?? [], rondes.data ?? [], alleVragen, scores.data ?? [])
  }
})
