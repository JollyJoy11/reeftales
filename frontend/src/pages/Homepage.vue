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

onMounted(async () => {
  await nextTick()

  refreshTimer = window.setTimeout(() => {
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
  }, 300)
})

onBeforeUnmount(() => {
  window.clearTimeout(refreshTimer)
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
    linear-gradient(180deg, #fffdf8 0%, #f6fbf8 44%, #fffdf8 100%);
  color: #2f4858;
}
</style>
