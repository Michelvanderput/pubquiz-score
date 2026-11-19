export default defineEventHandler(async (event) => {
  const body = await leesBody(event, nieuweVraagBody)
  const { quiz } = await requireQuizAccess(event, getRouterParam(event, 'id'), leesToken(event, body.token), 'admin')
  const supabase = useSupabaseAdmin()
  const roundId = getRouterParam(event, 'roundId')!

  const { data: ronde } = await supabase.from('rounds').select('id').eq('id', roundId).eq('quiz_id', quiz.id).maybeSingle()
  if (!ronde) throw createError({ statusCode: 404, statusMessage: 'Ronde niet gevonden' })

  const { data: laatste } = await supabase
    .from('questions').select('volgorde').eq('round_id', roundId).order('volgorde', { ascending: false }).limit(1).maybeSingle()

  const { data, error } = await supabase
    .from('questions')
    .insert({ quiz_id: quiz.id, round_id: roundId, volgorde: (laatste?.volgorde ?? 0) + 1, tekst: body.tekst, punten: body.punten ?? 1 })
    .select('id, round_id, volgorde, tekst, punten').single()
  if (error || !data) throw createError({ statusCode: 500, statusMessage: error?.message ?? 'Kon vraag niet toevoegen' })
  return { ...data, punten: Number(data.punten) }
})
