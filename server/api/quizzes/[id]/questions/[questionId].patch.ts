export default defineEventHandler(async (event) => {
  const body = await leesBody(event, wijzigVraagBody)
  const { quiz } = await requireQuizAccess(event, getRouterParam(event, 'id'), leesToken(event, body.token), 'admin')

  const update: Record<string, unknown> = {}
  if (body.tekst !== undefined) update.tekst = body.tekst
  if (body.punten !== undefined) update.punten = body.punten
  if (!Object.keys(update).length) throw createError({ statusCode: 400, statusMessage: 'Niets om te wijzigen' })

  const { data, error } = await useSupabaseAdmin()
    .from('questions').update(update).eq('id', getRouterParam(event, 'questionId')!).eq('quiz_id', quiz.id)
    .select('id, round_id, volgorde, tekst, punten').maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Vraag niet gevonden' })
  return { ...data, punten: Number(data.punten) }
})
