<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import ReefJourneySection from '@/components/home/ReefJourneySection.vue'
import FeatureSection from '@/components/home/FeatureSection.vue'
import MarinePreviewSection from '@/components/home/MarinePreviewSection.vue'
import CommunityPreviewSection from '@/components/home/CommunityPreviewSection.vue'
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
