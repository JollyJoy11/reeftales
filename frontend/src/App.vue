<script setup>
import { onMounted } from 'vue'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import AppAlert from '@/components/common/AppAlert.vue'

const toastStore = useToastStore()
const authStore = useAuthStore()

function applyStoredAppearance() {
  let storedUser = null

  try {
    storedUser = JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    storedUser = null
  }

  const theme = storedUser?.appearance_theme || localStorage.getItem('theme') || 'light'
  const fontSize = storedUser?.font_size || 'normal'
  const colorScheme = storedUser?.color_scheme || localStorage.getItem('color_scheme') || 'teal'
  const colorSchemes = ['teal', 'sunset']

  document.body.classList.toggle('dark-mode', theme === 'dark')
  document.body.classList.toggle('large-text-mode', Boolean(storedUser?.larger_text) || fontSize === 'large')
  document.body.classList.toggle('small-text-mode', fontSize === 'small')
  document.body.classList.toggle('reduced-motion-mode', Boolean(storedUser?.reduced_motion))
  document.body.classList.toggle('high-contrast-mode', Boolean(storedUser?.high_contrast))
  colorSchemes.forEach((scheme) =>
    document.body.classList.toggle(`color-scheme-${scheme}`, colorScheme === scheme)
  )
}

applyStoredAppearance()

onMounted(() => {
  authStore.loadCurrentUser().catch(() => {
    applyStoredAppearance()
  })
})
</script>

<template>
  <AppAlert
    v-if="toastStore.visible"
    :message="toastStore.message"
    :variant="toastStore.variant"
    @close="toastStore.hide()"
  />
  
  <router-view />
</template>
