<script setup lang="ts">
import { MAX_TEAMGROOTTE, MIN_TEAMGROOTTE, formatPunten, isGeldigeTeamgrootte } from '#shared/utils/quiz'
import type { Ronde, Vraag } from '#shared/types/quiz'

const route = useRoute()
const id = String(route.params.id)
const token = String(route.query.token ?? '')
const { data, fout, bezig, mutatie, zetScore } = useQuiz(id, token)

useSeoMeta({ title: () => data.value ? `${data.value.quiz.naam} – beheer` : 'Beheer' })

const tab = ref<'teams' | 'punten' | 'stand'>('teams')
const tabs = [
  { key: 'teams', label: 'Teams', icon: 'i-lucide-users' },
  { key: 'punten', label: 'Punten', icon: 'i-lucide-check-circle' },
  { key: 'stand', label: 'Stand', icon: 'i-lucide-trophy' }
] as const

// ── Links ───────────────────────────────────────────────────────────────
const origin = computed(() => import.meta.client ? window.location.origin : '')
const kijkLink = computed(() => data.value ? `${origin.value}/scorebord/${id}?token=${data.value.quiz.view_token}` : '')
const gekopieerd = ref(false)
async function kopieerLink() {
  await navigator.clipboard.writeText(kijkLink.value)
  gekopieerd.value = true
  setTimeout(() => (gekopieerd.value = false), 2000)
}

// ── Teams ───────────────────────────────────────────────────────────────
const nieuweSpeler = ref('')
const vrijeSpelers = computed(() => data.value?.spelers.filter(s => !s.team_id) ?? [])
const spelersVan = (teamId: string) => data.value?.spelers.filter(s => s.team_id === teamId) ?? []

async function voegSpelerToe() {
  const naam = nieuweSpeler.value.trim()
  if (!naam) return
  const r = await mutatie('POST', '/players', { naam })
  if (r) nieuweSpeler.value = ''
}

const teamNaam = ref('')
const gekozen = ref<string[]>([])
const teamKlaar = computed(() => teamNaam.value.trim() !== '' && isGeldigeTeamgrootte(gekozen.value.length))

function wisselSpeler(spelerId: string) {
  gekozen.value = gekozen.value.includes(spelerId)
    ? gekozen.value.filter(s => s !== spelerId)
    : gekozen.value.length < MAX_TEAMGROOTTE ? [...gekozen.value, spelerId] : gekozen.value
}

async function maakTeam() {
  if (!teamKlaar.value) return
  const r = await mutatie('POST', '/teams', { naam: teamNaam.value.trim(), spelerIds: gekozen.value })
  if (r) {
    teamNaam.value = ''
    gekozen.value = []
  }
}

async function verwijderTeam(teamId: string, naam: string) {
  if (confirm(`Team "${naam}" verwijderen? De spelers komen weer vrij en de punten van dit team verdwijnen.`)) {
    await mutatie('DELETE', `/teams/${teamId}`)
  }
}

async function verwijderSpeler(spelerId: string) {
  await mutatie('DELETE', `/players/${spelerId}`)
}

// ── Rondes & vragen ─────────────────────────────────────────────────────
const gekozenRondeId = ref<string | null>(null)
const ronde = computed<Ronde | undefined>(() => {
  const rondes = data.value?.rondes ?? []
  return rondes.find(r => r.id === gekozenRondeId.value)
    ?? rondes.find(r => r.status === 'open') ?? rondes[0]
})
const vragenVanRonde = computed(() => data.value?.vragen.filter(v => v.round_id === ronde.value?.id) ?? [])
const heeftScore = (vraagId: string, teamId: string) =>
  !!data.value?.scores.some(s => s.question_id === vraagId && s.team_id === teamId)

const nieuweVraag = ref('')
const nieuwePunten = ref(1)
async function voegVraagToe() {
  if (!ronde.value || !nieuweVraag.value.trim()) return
  const r = await mutatie('POST', `/rounds/${ronde.value.id}/questions`, { tekst: nieuweVraag.value.trim(), punten: nieuwePunten.value })
  if (r) nieuweVraag.value = ''
}

async function wijzigPunten(vraag: Vraag, delta: number) {
  const punten = Math.min(100, Math.max(0.5, vraag.punten + delta))
  if (punten !== vraag.punten) await mutatie('PATCH', `/questions/${vraag.id}`, { punten })
}

async function verwijderVraag(vraag: Vraag) {
  if (confirm('Vraag verwijderen? Toegekende punten voor deze vraag verdwijnen.')) {
    await mutatie('DELETE', `/questions/${vraag.id}`)
  }
}

async function zetRondeStatus(r: Ronde, status: 'open' | 'afgerond') {
  await mutatie('PATCH', `/rounds/${r.id}`, { status })
  if (status === 'afgerond') {
    const volgende = data.value?.rondes.find(x => x.status === 'open')
    if (volgende) gekozenRondeId.value = volgende.id
    // Eerst de tussenstand tonen; de volgende ronde staat klaar onder het tabblad Punten.
    tab.value = 'stand'
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 pb-24 pt-5">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs uppercase tracking-[.2em] text-white/50">
          Organisator
        </p>
        <h1 class="text-3xl">
          {{ data?.quiz.naam ?? 'Pubquiz' }}
        </h1>
      </div>
      <div
        v-if="data"
        class="text-right text-sm"
      >
        <p class="text-white/60">
          Quizcode
        </p>
        <p class="cijfer text-3xl tracking-widest text-amber-300">
          {{ data.quiz.quizcode }}
        </p>
      </div>
    </header>

    <div
      v-if="data"
      class="mt-3 flex flex-wrap gap-2"
    >
      <UButton
        :to="`/scorebord/${id}?token=${data.quiz.view_token}`"
        target="_blank"
        icon="i-lucide-tv"
        color="neutral"
        variant="subtle"
        size="sm"
      >
        Open scorebord
      </UButton>
      <UButton
        :icon="gekopieerd ? 'i-lucide-check' : 'i-lucide-copy'"
        color="neutral"
        variant="outline"
        size="sm"
        @click="kopieerLink"
      >
        {{ gekopieerd ? 'Gekopieerd' : 'Kopieer kijk-link' }}
      </UButton>
    </div>

    <UAlert
      v-if="fout"
      color="error"
      variant="subtle"
      :title="fout"
      class="mt-4"
    />

    <p
      v-if="!data && !fout"
      class="mt-6 text-white/60"
    >
      Laden…
    </p>

    <template v-if="data">
      <nav
        class="sticky top-0 z-10 -mx-4 mt-4 grid grid-cols-3 gap-1 bg-[#14110d]/95 px-4 py-2 backdrop-blur"
        aria-label="Onderdelen"
      >
        <UButton
          v-for="t in tabs"
          :key="t.key"
          :icon="t.icon"
          :color="tab === t.key ? 'primary' : 'neutral'"
          :variant="tab === t.key ? 'solid' : 'subtle'"
          @click="tab = t.key"
        >
          {{ t.label }}
        </UButton>
      </nav>

      <!-- TEAMS -->
      <section
        v-show="tab === 'teams'"
        class="mt-4 space-y-6"
      >
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 class="text-xl">
            1. Spelers
          </h2>
          <form
            class="mt-3 flex gap-2"
            @submit.prevent="voegSpelerToe"
          >
            <UInput
              v-model="nieuweSpeler"
              class="flex-1"
              placeholder="Naam speler"
              maxlength="40"
              aria-label="Naam speler"
            />
            <UButton
              type="submit"
              icon="i-lucide-plus"
              :loading="bezig"
            >
              Toevoegen
            </UButton>
          </form>
          <p
            v-if="!data.spelers.length"
            class="mt-3 text-sm text-white/50"
          >
            Voeg eerst alle spelers toe; daarna selecteer je wie samen een team vormt.
          </p>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 class="text-xl">
            2. Team maken
          </h2>
          <p class="mt-1 text-sm text-white/60">
            Kies {{ MIN_TEAMGROOTTE }} of {{ MAX_TEAMGROOTTE }} spelers die nog geen team hebben.
          </p>
          <ul
            v-if="vrijeSpelers.length"
            class="mt-3 flex flex-wrap gap-2"
          >
            <li
              v-for="s in vrijeSpelers"
              :key="s.id"
              class="flex"
            >
              <button
                type="button"
                class="rounded-full border px-3 py-1.5 text-sm transition"
                :class="gekozen.includes(s.id)
                  ? 'border-amber-400 bg-amber-400 font-semibold text-black'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'"
                :aria-pressed="gekozen.includes(s.id)"
                @click="wisselSpeler(s.id)"
              >
                {{ s.naam }}
              </button>
              <button
                type="button"
                class="ml-1 px-1 text-white/40 hover:text-red-400"
                :aria-label="`Verwijder ${s.naam}`"
                @click="verwijderSpeler(s.id)"
              >
                ×
              </button>
            </li>
          </ul>
          <p
            v-else
            class="mt-3 text-sm text-white/50"
          >
            Geen vrije spelers. Voeg spelers toe bij stap 1.
          </p>

          <form
            class="mt-4 flex gap-2"
            @submit.prevent="maakTeam"
          >
            <UInput
              v-model="teamNaam"
              class="flex-1"
              placeholder="Teamnaam"
              maxlength="40"
              aria-label="Teamnaam"
            />
            <UButton
              type="submit"
              :disabled="!teamKlaar"
              :loading="bezig"
            >
              Maak team ({{ gekozen.length }}/{{ MAX_TEAMGROOTTE }})
            </UButton>
          </form>
        </div>

        <div v-if="data.teams.length">
          <h2 class="text-xl">
            Teams ({{ data.teams.length }})
          </h2>
          <ul class="mt-3 space-y-2">
            <li
              v-for="team in data.teams"
              :key="team.id"
              class="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div>
                <p class="font-semibold">
                  {{ team.naam }}
                </p>
                <p class="text-sm text-white/60">
                  {{ spelersVan(team.id).map(s => s.naam).join(', ') }}
                </p>
              </div>
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                :aria-label="`Verwijder team ${team.naam}`"
                @click="verwijderTeam(team.id, team.naam)"
              />
            </li>
          </ul>
        </div>
      </section>

      <!-- PUNTEN -->
      <section
        v-show="tab === 'punten'"
        class="mt-4 space-y-4"
      >
        <p
          v-if="!data.teams.length"
          class="rounded-xl bg-white/5 p-4 text-sm text-white/70"
        >
          Maak eerst teams aan bij het tabblad Teams.
        </p>

        <div class="flex gap-1 overflow-x-auto pb-1">
          <button
            v-for="r in data.rondes"
            :key="r.id"
            type="button"
            class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition"
            :class="r.id === ronde?.id ? 'bg-amber-400 text-black' : 'bg-white/10 hover:bg-white/15'"
            @click="gekozenRondeId = r.id"
          >
            R{{ r.nummer }}<span v-if="r.status === 'afgerond'"> ✓</span>
          </button>
        </div>

        <template v-if="ronde">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-2xl">
              Ronde {{ ronde.nummer }}
            </h2>
            <UButton
              v-if="ronde.status === 'open'"
              icon="i-lucide-flag"
              color="success"
              :loading="bezig"
              @click="zetRondeStatus(ronde, 'afgerond')"
            >
              Ronde afronden
            </UButton>
            <UButton
              v-else
              icon="i-lucide-rotate-ccw"
              color="neutral"
              variant="subtle"
              @click="zetRondeStatus(ronde, 'open')"
            >
              Heropenen
            </UButton>
          </div>
          <p
            v-if="ronde.status === 'afgerond'"
            class="text-sm text-emerald-300"
          >
            Afgerond: de punten tellen mee in het scorebord. Je kunt nog corrigeren.
          </p>

          <ul class="space-y-3">
            <li
              v-for="(vraag, i) in vragenVanRonde"
              :key="vraag.id"
              class="rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="font-medium">
                  <span class="text-white/50">{{ i + 1 }}.</span> {{ vraag.tekst }}
                </p>
                <div class="flex shrink-0 items-center gap-1 text-sm">
                  <button
                    type="button"
                    class="size-7 rounded bg-white/10"
                    aria-label="Minder punten"
                    @click="wijzigPunten(vraag, -0.5)"
                  >
                    −
                  </button>
                  <span class="min-w-10 text-center">{{ formatPunten(vraag.punten) }} pt</span>
                  <button
                    type="button"
                    class="size-7 rounded bg-white/10"
                    aria-label="Meer punten"
                    @click="wijzigPunten(vraag, 0.5)"
                  >
                    +
                  </button>
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    aria-label="Verwijder vraag"
                    @click="verwijderVraag(vraag)"
                  />
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="team in data.teams"
                  :key="team.id"
                  type="button"
                  class="min-h-11 rounded-xl border px-3 text-sm font-semibold transition active:scale-95"
                  :class="heeftScore(vraag.id, team.id)
                    ? 'border-emerald-400 bg-emerald-400 text-black'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'"
                  :aria-pressed="heeftScore(vraag.id, team.id)"
                  @click="zetScore(vraag.id, team.id, !heeftScore(vraag.id, team.id))"
                >
                  {{ heeftScore(vraag.id, team.id) ? '✓ ' : '' }}{{ team.naam }}
                </button>
              </div>
            </li>
          </ul>
          <p
            v-if="!vragenVanRonde.length"
            class="text-sm text-white/50"
          >
            Nog geen vragen in deze ronde.
          </p>

          <form
            class="flex flex-wrap gap-2 rounded-2xl border border-dashed border-white/20 p-3"
            @submit.prevent="voegVraagToe"
          >
            <UInput
              v-model="nieuweVraag"
              class="min-w-48 flex-1"
              placeholder="Nieuwe vraag"
              maxlength="300"
              aria-label="Nieuwe vraag"
            />
            <UInput
              v-model.number="nieuwePunten"
              class="w-24"
              type="number"
              min="0.5"
              max="100"
              step="0.5"
              aria-label="Punten"
            />
            <UButton
              type="submit"
              icon="i-lucide-plus"
              :loading="bezig"
            >
              Vraag toevoegen
            </UButton>
          </form>
        </template>
      </section>

      <!-- STAND -->
      <section
        v-show="tab === 'stand'"
        class="mt-4"
      >
        <LiveScorebord :quiz="data" />
      </section>
    </template>
  </main>
</template>
