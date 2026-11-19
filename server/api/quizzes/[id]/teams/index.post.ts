export default defineEventHandler(async (event) => {
  const body = await leesBody(event, teamBody)
  const { quiz } = await requireQuizAccess(event, getRouterParam(event, 'id'), leesToken(event, body.token), 'admin')
  const supabase = useSupabaseAdmin()

  // Alle gekozen spelers moeten bij deze quiz horen en nog vrij zijn.
  const { data: spelers, error: spelersFout } = await supabase
    .from('players').select('id, naam, team_id').eq('quiz_id', quiz.id).in('id', body.spelerIds)
  if (spelersFout) throw createError({ statusCode: 500, statusMessage: spelersFout.message })
  if ((spelers ?? []).length !== body.spelerIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'Onbekende speler gekozen' })
  }
  const bezet = (spelers ?? []).find(s => s.team_id)
  if (bezet) {
    throw createError({ statusCode: 409, statusMessage: `${bezet.naam} zit al in een team` })
  }

  const { data: team, error } = await supabase
    .from('teams').insert({ quiz_id: quiz.id, naam: body.naam }).select('id, naam').single()
  if (error?.code === '23505') {
    throw createError({ statusCode: 409, statusMessage: `Teamnaam "${body.naam}" bestaat al` })
  }
  if (error || !team) throw createError({ statusCode: 500, statusMessage: error?.message ?? 'Kon team niet aanmaken' })

  // Alleen vrije spelers koppelen: bij een race met een ander team blijft de koppeling heel.
  const { data: gekoppeld, error: koppelFout } = await supabase
    .from('players').update({ team_id: team.id }).in('id', body.spelerIds).is('team_id', null).select('id')
  if (koppelFout || (gekoppeld ?? []).length !== body.spelerIds.length) {
    await supabase.from('teams').delete().eq('id', team.id)
    throw createError({ statusCode: 409, statusMessage: koppelFout?.message ?? 'Een van de spelers zit inmiddels in een ander team' })
  }
  return team
})
