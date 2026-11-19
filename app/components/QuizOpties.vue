<script setup lang="ts">
import type { QuizInstellingen } from '#shared/types/quiz'

const model = defineModel<QuizInstellingen>({ required: true })

const opties = [
  {
    key: 'meerdereTeamsPerVraag',
    label: 'Meerdere teams per vraag',
    uit: 'Elke vraag heeft maximaal één winnend team; een nieuw team vervangt het vorige.',
    aan: 'Alle teams met het goede antwoord krijgen het punt.'
  },
  {
    key: 'toonVragen',
    label: 'Vragen tonen op het scorebord',
    uit: 'Alleen jij ziet de vragen; het scorebord toont alleen de stand.',
    aan: 'Het scorebord toont de vragen van de lopende ronde.'
  },
  {
    key: 'tussenstandNaRonde',
    label: 'Tussenstand na elke ronde',
    uit: 'Na het afronden van een ronde blijf je op het scherm waar je was.',
    aan: 'Na het afronden van een ronde zie je eerst de tussenstand.'
  }
] as const
</script>

<template>
  <fieldset class="space-y-3">
    <legend class="mb-1 text-sm font-semibold text-white/80">
      Opties
    </legend>
    <div
      v-for="optie in opties"
      :key="optie.key"
      class="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
    >
      <div>
        <p class="font-medium">
          {{ optie.label }}
        </p>
        <p class="text-sm text-white/60">
          {{ model[optie.key] ? optie.aan : optie.uit }}
        </p>
      </div>
      <USwitch
        :model-value="model[optie.key]"
        :aria-label="optie.label"
        @update:model-value="model = { ...model, [optie.key]: $event }"
      />
    </div>
  </fieldset>
</template>
