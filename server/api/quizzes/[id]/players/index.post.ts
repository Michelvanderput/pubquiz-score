export default defineEventHandler(async (event) => {
  const body = await leesBody(event, spelerBody)
  const { quiz } = await requireQuizAccess(event, getRouterParam(event, 'id'), leesToken(event, body.token), 'admin')

  const { data, error } = await useSupabaseAdmin()
    .from('players').insert({ quiz_id: quiz.id, naam: body.naam }).select('id, naam, team_id').single()
  if (error?.code === '23505') {
    throw createError({ statusCode: 409, statusMessage: `"${body.naam}" bestaat al` })
  }
  if (error || !data) throw createError({ statusCode: 500, statusMessage: error?.message ?? 'Kon speler niet toevoegen' })
  return data
})
