<script setup>
import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MainLayout from '@/layouts/MainLayout.vue'
import ReefJourneySection from '@/components/home/ReefJourneySection.vue'
import FeatureSection from '@/components/home/FeatureSection.vue'
import MarinePreviewSection from '@/components/home/MarinePreviewSection.vue'
import CommunityPreviewSection from '@/components/home/CommunityPreviewSection.vue'

gsap.registerPlugin(ScrollTrigger)

let refreshTimer
let loadRefreshHandler
let preferencesRefreshHandler

function refreshScrollLayout() {
  ScrollTrigger.sort()
  ScrollTrigger.refresh()
}

onMounted(async () => {
  await nextTick()

  // Delay long enough for async data sections (marine, community) to resolve
  // and render their real content before we refresh all scroll positions.
  refreshTimer = window.setTimeout(() => {
    refreshScrollLayout()
  }, 800)

  loadRefreshHandler = refreshScrollLayout
  preferencesRefreshHandler = () => {
    window.setTimeout(refreshScrollLayout, 60)
  }

  window.addEventListener('load', loadRefreshHandler, { once: true })
  window.addEventListener('reef:layout-preferences-changed', preferencesRefreshHandler)
})

onBeforeUnmount(() => {
  window.clearTimeout(refreshTimer)
  if (loadRefreshHandler) {
    window.removeEventListener('load', loadRefreshHandler)
  }
  if (preferencesRefreshHandler) {
    window.removeEventListener('reef:layout-preferences-changed', preferencesRefreshHandler)
  }
})
</script>

<template>
  <MainLayout>
    <main class="home-page">
      <ReefJourneySection />
      
      <FeatureSection />
      
      <MarinePreviewSection />
      
      <CommunityPreviewSection />
    </main>
  </MainLayout>
</template>

<style scoped>
.home-page {
  position: relative;
  overflow-x: hidden;
  background:
    radial-gradient(circle at top left, rgba(169,216,214,0.32), transparent 34%),
    linear-gradient(180deg, var(--surface-soft) 0%, var(--page-bg) 100%);
  color: var(--text-primary);
}
</style>
