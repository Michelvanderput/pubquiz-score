export default defineEventHandler(async (event) => {
  const { quiz } = await requireQuizAccess(event, getRouterParam(event, 'id'), leesToken(event), 'admin')
  const { error } = await useSupabaseAdmin()
    .from('questions').delete().eq('id', getRouterParam(event, 'questionId')!).eq('quiz_id', quiz.id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { ok: true }
})
