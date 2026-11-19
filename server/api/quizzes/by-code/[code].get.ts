// Zoekt een quiz op de 4-cijferige code. Geeft alleen het kijk-token terug.
export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')?.trim() ?? ''
  if (!/^\d{4}$/.test(code)) {
    throw createError({ statusCode: 400, statusMessage: 'Een quizcode bestaat uit precies 4 cijfers' })
  }
  const { data, error } = await useSupabaseAdmin()
    .from('quizzes').select('id, view_token').eq('quizcode', code).maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Geen quiz gevonden met deze code' })
  return { id: data.id, viewToken: data.view_token }
})
