import type { H3Event } from 'h3'
import { useSupabaseAdmin } from './supabase'

export type QuizRol = 'admin' | 'viewer'

export interface QuizRow {
  id: string
  naam: string
  aantal_rondes: number
  quizcode: string | null
  admin_token: string
  view_token: string
}

// Haalt de quiz op en controleert of het token (admin of kijk) toegang geeft.
export async function requireQuizAccess(
  event: H3Event,
  quizId: string | undefined,
  token: string | undefined,
  requiredRole: QuizRol = 'viewer'
): Promise<{ quiz: QuizRow, role: QuizRol }> {
  if (!quizId) throw createError({ statusCode: 400, statusMessage: 'Quiz-id ontbreekt' })
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Toegangscode ontbreekt' })

  const { data: quiz, error } = await useSupabaseAdmin()
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .maybeSingle()

  if (error || !quiz) throw createError({ statusCode: 404, statusMessage: 'Quiz niet gevonden' })

  const role: QuizRol | null = token === quiz.admin_token ? 'admin' : token === quiz.view_token ? 'viewer' : null
  if (!role) throw createError({ statusCode: 403, statusMessage: 'Ongeldige toegangscode' })
  if (requiredRole === 'admin' && role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Alleen de organisator kan dit doen' })
  }
  return { quiz, role }
}

// Schrijf-endpoints krijgen het token als header of in de body/query.
export function leesToken(event: H3Event, bodyToken?: string): string | undefined {
  return bodyToken ?? (getQuery(event).token as string | undefined)
}
