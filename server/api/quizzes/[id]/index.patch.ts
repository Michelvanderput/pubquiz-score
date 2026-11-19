export default defineEventHandler(async (event) => {
  const body = await leesBody(event, wijzigInstellingenBody)
  const { quiz } = await requireQuizAccess(event, getRouterParam(event, 'id'), leesToken(event, body.token), 'admin')

  const update: Record<string, boolean> = {}
  if (body.meerdereTeamsPerVraag !== undefined) update.meerdere_teams_per_vraag = body.meerdereTeamsPerVraag
  if (body.toonVragen !== undefined) update.toon_vragen = body.toonVragen
  if (body.tussenstandNaRonde !== undefined) update.tussenstand_na_ronde = body.tussenstandNaRonde
  if (!Object.keys(update).length) throw createError({ statusCode: 400, statusMessage: 'Niets om te wijzigen' })

  const { data, error } = await useSupabaseAdmin()
    .from('quizzes').update(update).eq('id', quiz.id)
    .select('meerdere_teams_per_vraag, toon_vragen, tussenstand_na_ronde').single()
  if (error || !data) throw createError({ statusCode: 500, statusMessage: error?.message ?? 'Kon instellingen niet opslaan' })
  return instellingenUitRij(data)
})
