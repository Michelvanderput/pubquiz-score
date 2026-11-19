<script setup lang="ts">
import { STANDAARD_RONDES } from '#shared/utils/quiz'

const naam = ref('')
const aantalRondes = ref(STANDAARD_RONDES)
const quizcode = ref(String(Math.floor(1000 + Math.random() * 9000)))
const bezig = ref(false)
const fout = ref('')

async function maakQuiz() {
  fout.value = ''
  bezig.value = true
  try {
    const r = await $fetch<{ id: string, adminToken: string }>('/api/quizzes', {
      method: 'POST',
      body: { naam: naam.value, aantalRondes: aantalRondes.value, quizcode: quizcode.value }
    })
    await navigateTo(`/beheer/${r.id}?token=${r.adminToken}`)
  } catch (e) {
    fout.value = foutTekst(e)
  } finally {
    bezig.value = false
  }
}

const code = ref('')
const codeFout = ref('')
async function naarScorebord() {
  codeFout.value = ''
  try {
    const r = await $fetch<{ id: string, viewToken: string }>(`/api/quizzes/by-code/${code.value.trim()}`)
    await navigateTo(`/scorebord/${r.id}?token=${r.viewToken}`)
  } catch (e) {
    codeFout.value = foutTekst(e)
  }
}
</script>

<template>
  <main class="mx-auto max-w-xl px-4 py-10">
    <h1 class="text-5xl sm:text-6xl">
      Pubquiz<span class="text-amber-400">.</span>
    </h1>
    <p class="mt-2 text-white/60">
      Maak teams, voer de vragen in en geef punten. Iedereen volgt het live scorebord.
    </p>

    <form
      class="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5"
      @submit.prevent="maakQuiz"
    >
      <h2 class="text-2xl">
        Nieuwe quiz
      </h2>
      <UFormField label="Naam van de quiz">
        <UInput
          v-model="naam"
          class="w-full"
          placeholder="Bijv. Kroegquiz november"
          maxlength="80"
          required
        />
      </UFormField>
      <div class="grid grid-cols-2 gap-3">
        <UFormField label="Aantal rondes">
          <UInput
            v-model.number="aantalRondes"
            class="w-full"
            type="number"
            min="1"
            max="20"
            required
          />
        </UFormField>
        <UFormField
          label="Quizcode"
          help="4 cijfers voor gasten"
        >
          <UInput
            v-model="quizcode"
            class="w-full"
            inputmode="numeric"
            pattern="\d{4}"
            maxlength="4"
            required
          />
        </UFormField>
      </div>
      <UAlert
        v-if="fout"
        color="error"
        variant="subtle"
        :title="fout"
      />
      <UButton
        type="submit"
        block
        size="lg"
        :loading="bezig"
      >
        Quiz aanmaken
      </UButton>
    </form>

    <form
      class="mt-6 rounded-2xl border border-white/10 p-5"
      @submit.prevent="naarScorebord"
    >
      <h2 class="text-xl">
        Al een quizcode?
      </h2>
      <div class="mt-3 flex gap-2">
        <UInput
          v-model="code"
          class="flex-1"
          inputmode="numeric"
          maxlength="4"
          placeholder="0000"
          aria-label="Quizcode"
        />
        <UButton
          type="submit"
          color="neutral"
          variant="subtle"
        >
          Naar scorebord
        </UButton>
      </div>
      <p
        v-if="codeFout"
        class="mt-2 text-sm text-red-400"
      >
        {{ codeFout }}
      </p>
    </form>
  </main>
</template>
