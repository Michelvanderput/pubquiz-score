export default defineEventHandler(async (event) => {
  const body = await leesBody(event, wijzigRondeBody)
  const { quiz } = await requireQuizAccess(event, getRouterParam(event, 'id'), leesToken(event, body.token), 'admin')

  const update: Record<string, unknown> = {}
  if (body.status !== undefined) update.status = body.status
  if (body.titel !== undefined) update.titel = body.titel || null
  if (!Object.keys(update).length) throw createError({ statusCode: 400, statusMessage: 'Niets om te wijzigen' })

  const { data, error } = await useSupabaseAdmin()
    .from('rounds').update(update).eq('id', getRouterParam(event, 'roundId')!).eq('quiz_id', quiz.id)
    .select('id, nummer, titel, status').maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Ronde niet gevonden' })
  return data
})
