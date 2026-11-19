// Spelers van het team komen weer vrij (on delete set null); punten van het team verdwijnen.
export default defineEventHandler(async (event) => {
  const { quiz } = await requireQuizAccess(event, getRouterParam(event, 'id'), leesToken(event), 'admin')
  const { error } = await useSupabaseAdmin()
    .from('teams').delete().eq('id', getRouterParam(event, 'teamId')!).eq('quiz_id', quiz.id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { ok: true }
})
