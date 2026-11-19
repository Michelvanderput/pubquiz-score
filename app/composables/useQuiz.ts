import type { QuizResponse } from '#shared/types/quiz'
import { berekenStand } from '#shared/utils/quiz'

// Haalt de quiz op en ververst elke paar seconden, zodat het scorebord live
// meebeweegt. De organisator-acties passen de lokale staat meteen aan
// (optimistisch) en herstellen bij een fout via een verse fetch.
export function useQuiz(id: string, token: string, intervalMs = 3000) {
  const data = ref<QuizResponse | null>(null)
  const fout = ref('')
  const bezig = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined
  let mutaties = 0

  async function laad() {
    // Tijdens een lopende mutatie niet overschrijven: dat laat tikken terugspringen.
    if (mutaties > 0) return
    try {
      data.value = await $fetch<QuizResponse>(`/api/quizzes/${id}`, { query: { token } })
      fout.value = ''
    } catch (e) {
      fout.value = foutTekst(e)
    }
  }

  async function aanroep<T>(methode: 'POST' | 'PUT' | 'PATCH' | 'DELETE', pad: string, body?: Record<string, unknown>): Promise<T> {
    mutaties++
    try {
      // Dynamisch pad + generiek resultaat: de getypte Nitro-routes passen hier niet op.
      const ruweFetch = $fetch as (url: string, opties: object) => Promise<T>
      return await ruweFetch(`/api/quizzes/${id}${pad}`, {
        method: methode,
        query: { token },
        body: body ? { ...body, token } : undefined
      })
    } finally {
      mutaties--
    }
  }

  // Na elke mutatie komt de stand opnieuw van de server (bron van waarheid).
  async function mutatie<T>(methode: 'POST' | 'PUT' | 'PATCH' | 'DELETE', pad: string, body?: Record<string, unknown>): Promise<T | undefined> {
    bezig.value = true
    try {
      const resultaat = await aanroep<T>(methode, pad, body)
      await laad()
      return resultaat
    } catch (e) {
      fout.value = foutTekst(e)
      await laad()
      return undefined
    } finally {
      bezig.value = false
    }
  }

  async function zetScore(questionId: string, teamId: string, toegekend: boolean) {
    const huidig = data.value
    if (!huidig) return
    const zonder = huidig.scores.filter(s => !(s.question_id === questionId && s.team_id === teamId))
    huidig.scores = toegekend ? [...zonder, { question_id: questionId, team_id: teamId }] : zonder
    huidig.stand = berekenStand(huidig.teams, huidig.rondes, huidig.vragen, huidig.scores)
    try {
      await aanroep('PUT', `/questions/${questionId}/scores/${teamId}`, { toegekend })
      fout.value = ''
    } catch (e) {
      fout.value = foutTekst(e)
    }
    await laad()
  }

  onMounted(() => {
    laad()
    timer = setInterval(laad, intervalMs)
  })
  onBeforeUnmount(() => clearInterval(timer))

  return { data, fout, bezig, laad, mutatie, zetScore }
}

export function foutTekst(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string, message?: string }
  return err?.data?.statusMessage ?? err?.statusMessage ?? err?.message ?? 'Er ging iets mis'
}
