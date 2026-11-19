<script setup lang="ts">
import type { QuizResponse } from '#shared/types/quiz'
import { formatPunten } from '#shared/utils/quiz'

const props = defineProps<{ quiz: QuizResponse }>()

const spelersPerTeam = computed(() => {
  const kaart = new Map<string, string[]>()
  for (const s of props.quiz.spelers) {
    if (s.team_id) kaart.set(s.team_id, [...(kaart.get(s.team_id) ?? []), s.naam])
  }
  return kaart
})

const afgerondeRondes = computed(() => props.quiz.rondes.filter(r => r.status === 'afgerond'))
const lopendeRonde = computed(() => props.quiz.rondes.find(r => r.status === 'open'
  && props.quiz.vragen.some(v => v.round_id === r.id)))

const zichtbareVragen = computed(() => props.quiz.vragen.filter(v =>
  v.round_id === lopendeRonde.value?.id && v.tekst))

const medaille = (plek: number) => ['🥇', '🥈', '🥉'][plek - 1] ?? ''
</script>

<template>
  <div>
    <p
      v-if="!quiz.stand.length"
      class="rounded-xl bg-white/5 p-6 text-center text-white/60"
    >
      Nog geen teams. Zodra de organisator teams aanmaakt, verschijnen ze hier.
    </p>

    <!-- Alle teams naast elkaar -->
    <ol
      v-else
      class="grid gap-3"
      :style="{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }"
    >
      <li
        v-for="team in quiz.stand"
        :key="team.teamId"
        class="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-4"
        :class="team.plek === 1 && team.totaal > 0 ? 'border-amber-400/70 bg-amber-400/10' : ''"
      >
        <div class="flex items-center justify-between text-sm text-white/60">
          <span>#{{ team.plek }}</span>
          <span>{{ medaille(team.plek) }}</span>
        </div>
        <h3 class="mt-1 break-words text-xl leading-tight">
          {{ team.naam }}
        </h3>
        <p class="cijfer mt-3 text-6xl leading-none text-amber-300">
          {{ formatPunten(team.totaal) }}
        </p>
        <p
          class="mt-1 min-h-5 text-sm"
          :class="team.live ? 'text-emerald-300' : 'text-transparent'"
        >
          <template v-if="team.live">
            +{{ formatPunten(team.live) }} live
          </template>
          <template v-else>
            –
          </template>
        </p>
        <p class="mt-2 text-xs text-white/50">
          {{ (spelersPerTeam.get(team.teamId) ?? []).join(', ') }}
        </p>
      </li>
    </ol>

    <p
      v-if="quiz.stand.length && lopendeRonde"
      class="mt-3 text-center text-sm text-white/60"
    >
      Ronde {{ lopendeRonde.nummer }} loopt: het totaal verspringt zodra de ronde is afgerond.
    </p>

    <section
      v-if="quiz.quiz.instellingen.toonVragen && lopendeRonde && zichtbareVragen.length"
      class="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4"
    >
      <h2 class="text-xl">
        Ronde {{ lopendeRonde.nummer }}
      </h2>
      <ol class="mt-2 list-decimal space-y-1 pl-5">
        <li
          v-for="vraag in zichtbareVragen"
          :key="vraag.id"
        >
          {{ vraag.tekst }}
        </li>
      </ol>
    </section>

    <!-- Punten per ronde -->
    <div
      v-if="quiz.stand.length && afgerondeRondes.length"
      class="mt-6 overflow-x-auto rounded-xl border border-white/10"
    >
      <table class="w-full text-left text-sm">
        <thead class="bg-white/5 text-xs uppercase tracking-wider text-white/60">
          <tr>
            <th class="px-3 py-2">
              Team
            </th>
            <th
              v-for="ronde in afgerondeRondes"
              :key="ronde.id"
              class="px-3 py-2 text-center"
            >
              R{{ ronde.nummer }}
            </th>
            <th class="px-3 py-2 text-right">
              Totaal
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="team in quiz.stand"
            :key="team.teamId"
            class="border-t border-white/10"
          >
            <td class="px-3 py-2 font-medium">
              {{ team.naam }}
            </td>
            <td
              v-for="ronde in afgerondeRondes"
              :key="ronde.id"
              class="px-3 py-2 text-center"
            >
              {{ formatPunten(team.perRonde[ronde.id] ?? 0) }}
            </td>
            <td class="px-3 py-2 text-right font-bold text-amber-300">
              {{ formatPunten(team.totaal) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
