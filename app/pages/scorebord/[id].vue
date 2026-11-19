<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)
const token = String(route.query.token ?? '')
const { data, fout } = useQuiz(id, token)

useSeoMeta({ title: () => data.value ? `${data.value.quiz.naam} – scorebord` : 'Scorebord' })
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-6">
    <header class="mb-5 flex flex-wrap items-end justify-between gap-2">
      <div>
        <p class="text-xs uppercase tracking-[.2em] text-white/50">
          Live scorebord
        </p>
        <h1 class="text-3xl sm:text-5xl">
          {{ data?.quiz.naam ?? 'Pubquiz' }}
        </h1>
      </div>
      <UButton
        v-if="data?.role === 'admin'"
        :to="`/beheer/${id}?token=${token}`"
        icon="i-lucide-settings"
        color="neutral"
        variant="subtle"
      >
        Beheer
      </UButton>
    </header>

    <UAlert
      v-if="fout"
      color="error"
      variant="subtle"
      :title="fout"
      class="mb-4"
    />
    <LiveScorebord
      v-if="data"
      :quiz="data"
    />
    <p
      v-else-if="!fout"
      class="text-white/60"
    >
      Laden…
    </p>
  </main>
</template>
