import type { H3Event } from 'h3'
import { z } from 'zod'
import { MAX_TEAMGROOTTE, MIN_TEAMGROOTTE } from '#shared/utils/quiz'

export async function leesBody<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.infer<T>> {
  const result = schema.safeParse((await readBody(event)) ?? {})
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Ongeldige invoer' })
  }
  return result.data
}

// Ontbrekend token wordt pas in requireQuizAccess afgekeurd (401).
const token = z.string().optional()
const naam = (label: string, max = 40) =>
  z.string(`${label} is verplicht`).trim().min(1, `${label} is verplicht`).max(max, `${label} is te lang (max. ${max} tekens)`)

export const maakQuizBody = z.object({
  naam: naam('Naam van de quiz', 80),
  aantalRondes: z.coerce.number('Ongeldig aantal rondes').int('Ongeldig aantal rondes').min(1, 'Minimaal 1 ronde').max(20, 'Maximaal 20 rondes'),
  quizcode: z.string('De quizcode moet precies 4 cijfers zijn').trim().regex(/^\d{4}$/, 'De quizcode moet precies 4 cijfers zijn')
})

export const spelerBody = z.object({ token, naam: naam('Spelersnaam') })

export const teamBody = z.object({
  token,
  naam: naam('Teamnaam'),
  spelerIds: z.array(z.uuid('Ongeldige speler'), 'Kies de spelers van het team')
    .min(MIN_TEAMGROOTTE, `Een team heeft minimaal ${MIN_TEAMGROOTTE} spelers`)
    .max(MAX_TEAMGROOTTE, `Een team heeft maximaal ${MAX_TEAMGROOTTE} spelers`)
    .refine(ids => new Set(ids).size === ids.length, 'Een speler staat dubbel in het team')
})

export const nieuweVraagBody = z.object({
  token,
  tekst: naam('De vraag', 300),
  punten: z.number('Ongeldige punten').refine(v => Number.isInteger(v * 2), 'Punten mogen hele of halve getallen zijn').min(0.5, 'Minimaal 0,5 punt').max(100, 'Maximaal 100 punten').optional()
})

export const wijzigVraagBody = z.object({
  token,
  tekst: naam('De vraag', 300).optional(),
  punten: z.number('Ongeldige punten').refine(v => Number.isInteger(v * 2), 'Punten mogen hele of halve getallen zijn').min(0.5, 'Minimaal 0,5 punt').max(100, 'Maximaal 100 punten').optional()
})

export const wijzigRondeBody = z.object({
  token,
  status: z.enum(['open', 'afgerond'], 'Ongeldige status').optional(),
  titel: z.string().trim().max(60, 'Rondetitel is te lang').nullable().optional()
})

export const scoreBody = z.object({ token, toegekend: z.boolean('Geef aan of het punt wordt toegekend') })
export const tokenBody = z.object({ token })
