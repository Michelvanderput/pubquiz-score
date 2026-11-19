// Kent een punt toe aan een team voor een vraag (toegekend: true) of haalt het weg (false).
export default defineEventHandler(async (event) => {
  const body = await leesBody(event, scoreBody)
  const { quiz } = await requireQuizAccess(event, getRouterParam(event, 'id'), leesToken(event, body.token), 'admin')
  const supabase = useSupabaseAdmin()
  const questionId = getRouterParam(event, 'questionId')!
  const teamId = getRouterParam(event, 'teamId')!

  const [vraag, team] = await Promise.all([
    supabase.from('questions').select('id').eq('id', questionId).eq('quiz_id', quiz.id).maybeSingle(),
    supabase.from('teams').select('id').eq('id', teamId).eq('quiz_id', quiz.id).maybeSingle()
  ])
  if (!vraag.data || !team.data) throw createError({ statusCode: 404, statusMessage: 'Vraag of team niet gevonden' })

  const { error } = body.toegekend
    ? await supabase.from('question_scores').upsert({ question_id: questionId, team_id: teamId, quiz_id: quiz.id })
    : await supabase.from('question_scores').delete().eq('question_id', questionId).eq('team_id', teamId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { question_id: questionId, team_id: teamId, toegekend: body.toegekend }
})
