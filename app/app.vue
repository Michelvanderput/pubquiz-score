<script setup lang="ts">
const title = 'Pubquiz Score'
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { name: 'theme-color', content: '#112317' }
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'nl' }
})
useSeoMeta({ title, description: 'Teams, rondes en een live scorebord voor je pubquiz.' })
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
