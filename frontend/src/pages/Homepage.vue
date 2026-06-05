<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MainLayout from '@/layouts/MainLayout.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ReefJourneySection from '@/components/home/ReefJourneySection.vue'
import FeatureSection from '@/components/home/FeatureSection.vue'
import MarinePreviewSection from '@/components/home/MarinePreviewSection.vue'
import CommunityPreviewSection from '@/components/home/CommunityPreviewSection.vue'
import { getPublicJournals } from '@/services/journalService'
import { getSpecies } from '@/services/speciesService'

gsap.registerPlugin(ScrollTrigger)

const { t } = useI18n()
const loading = ref(true)
const species = ref([])
const journals = ref([])

let refreshTimer
let loadRefreshHandler
let preferencesRefreshHandler

const featuredSpecies = computed(() => shuffle(species.value).slice(0, 4))

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

async function loadHomepageData() {
  loading.value = true

  const [speciesResult, journalsResult] = await Promise.allSettled([
    getSpecies(),
    getPublicJournals({ sort: 'newest' })
  ])

  species.value = speciesResult.status === 'fulfilled' && Array.isArray(speciesResult.value)
    ? speciesResult.value
    : []

  journals.value = journalsResult.status === 'fulfilled' && Array.isArray(journalsResult.value)
    ? journalsResult.value
    : []

  loading.value = false
}

function refreshScrollLayout() {
  ScrollTrigger.sort()
  ScrollTrigger.refresh()
}

onMounted(async () => {
  await loadHomepageData()
  await nextTick()
  refreshTimer = window.setTimeout(refreshScrollLayout, 60)

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
    <main v-if="loading" class="home-loading-page">
      <LoadingState :message="t('home.loading')" />
    </main>

    <main v-else class="home-page">
      <ReefJourneySection />
      
      <FeatureSection />
      
      <MarinePreviewSection :species="featuredSpecies" />
      
      <CommunityPreviewSection :journals="journals" />
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

.home-loading-page {
  min-height: calc(100vh - var(--navbar-h));
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top left, rgba(169,216,214,0.32), transparent 34%),
    linear-gradient(180deg, var(--surface-soft) 0%, var(--page-bg) 100%);
}
</style>
