export default defineEventHandler(async (event) => {
  const { quiz } = await requireQuizAccess(event, getRouterParam(event, 'id'), leesToken(event), 'admin')
  const { error } = await useSupabaseAdmin()
    .from('players').delete().eq('id', getRouterParam(event, 'playerId')!).eq('quiz_id', quiz.id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { ok: true }
})
