<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import { useSavedIslandStore } from '@/stores/savedIslandStore'
import { useToastStore } from '@/stores/toastStore'

const { t } = useI18n()
const authStore = useAuthStore()
const savedIslandStore = useSavedIslandStore()
const toastStore = useToastStore()

const isSaved = computed(() => savedIslandStore.isSaved(props.island.id))

async function handleSave(event) {
  event.preventDefault()
  event.stopPropagation()

  if (!authStore.isLoggedIn) {
    toastStore.danger(t('toast.saveIslandLogin'))
    return
  }

  try {
    await savedIslandStore.toggle(props.island)
  } catch (error) {
    toastStore.danger(t('toast.saveIslandError'))
  }
}

const props = defineProps({
  island: {
    type: Object,
    required: true
  },
  tiltVariant: {
    type: Number,
    default: 0
  }
})

function splitList(value) {
  if (!value) return []
  return value.split(',').filter(Boolean)
}

function visibleBadges(list, limit = 2) {
  return list.slice(0, limit)
}

function extraCount(list, limit = 2) {
  return list.length > limit ? list.length - limit : 0
}

const activities = computed(() => splitList(props.island.activities))
const islandImageAlt = computed(() => {
  const location = [props.island.location, props.island.country].filter(Boolean).join(', ')
  return `${props.island.name || 'Island destination'}${location ? ` in ${location}` : ''}`
})
</script>

<template>
  <RouterLink :to="`/discovery/island/${island.id}`" class="text-decoration-none">
    <article class="island-label-card h-100">
      <button
        class="save-island-btn"
        type="button"
        @click="handleSave"
      >
        <i :class="isSaved ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'"></i>
      </button>

      <div class="stamp-image-area" :class="`stamp-tilt-${tiltVariant % 3}`">
        <img
          :src="island.cover_image || '/images/island-placeholder.jpg'"
          class="island-image"
          :alt="islandImageAlt"
        />
      </div>

      <div class="label-body">
        <h4>{{ island.name }}</h4>
        <p class="subtitle">{{ island.location }}, {{ island.country }}</p>

        <div class="info-grid">
          <div>
            <span>Region</span>
            <strong>{{ island.continent || 'Island' }}</strong>
          </div>

          <div>
            <span>Best Time</span>
            <strong>{{ island.best_visit_time || 'Anytime' }}</strong>
          </div>
        </div>

        <p class="island-desc">{{ island.description }}</p>

        <div class="badge-section">
          <span
            v-for="item in visibleBadges(activities)"
            :key="item"
            class="badge rounded-pill activity-badge"
          >
            {{ item }}
          </span>

          <span v-if="extraCount(activities)" class="badge rounded-pill more-badge">
            +{{ extraCount(activities) }}
          </span>
        </div>
      </div>
    </article>
  </RouterLink>
</template>

<style scoped>
.island-label-card {
  padding: 12px;
  background: #f4dfc4;
  box-shadow: 0 18px 36px rgba(47,72,88,0.16);
  transition: transform 0.2s ease;
  transform: rotate(0.4deg);
  
  --r: 5px;
  --s: 15px;

  mask:
    radial-gradient(var(--r) at var(--r) 50%, transparent 98%, black)
      calc(-1*var(--r)) 50% / 100% var(--s),
    radial-gradient(var(--r) at 50% var(--r), transparent 98%, black)
      50% calc(-1*var(--r)) / var(--s) 100%;
  mask-composite: intersect;
  position: relative;
}

.island-label-card:hover {
  transform: rotate(0deg) translateY(-4px);
  box-shadow: 0 22px 44px rgba(15,143,152,0.18);
}

.save-island-btn {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 5;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  color: var(--accent);
  box-shadow: 0 6px 14px rgba(0,0,0,0.18);
}

.save-island-btn:hover {
  background: var(--accent);
  color: white;
}

.save-island-btn i {
  transition: transform 0.2s ease;
}

.save-island-btn:active i {
  transform: scale(1.2);
}

.stamp-image-area {
  height: 200px;
  background: #f6f3eb;
  margin: 10px;
  padding: 10px 8px 24px 8px;
  overflow: hidden;
  box-shadow: 0 6px 10px rgba(0,0,0,0.18);
}

.stamp-image-area.stamp-tilt-0 {
  transform: rotate(-1.5deg);
}

.stamp-image-area.stamp-tilt-1 {
  transform: rotate(1deg);
}

.stamp-image-area.stamp-tilt-2 {
  transform: rotate(-0.5deg);
}

.island-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 2px solid #475569;
}

.label-body {
  padding: 10px 12px 18px;
  color: #1e293b;
}

.label-body h4 {
  text-align: center;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 2px;
  letter-spacing: 0.5px;
}

.subtitle {
  text-align: center;
  font-size: 0.78rem;
  color: #475569;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin: 12px 0;
}

.info-grid div {
  padding: 8px;
}

.info-grid div:first-child {
  border-right: 1px solid var(--border);
}

.info-grid span {
  display: block;
  font-size: 0.7rem;
  color: #536273;
}

.info-grid strong {
  color: #1e293b;
  font-size: 0.78rem;
}

.island-desc {
  font-size: 0.82rem;
  color: #475569;
  display: block;
  line-clamp: 2;
  overflow: hidden;
}

.badge-section {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.activity-badge {
  background: #dff6f0;
  color: #0f766e;
  border: 1px dashed rgba(42, 123, 136, 0.4);
}

.more-badge {
  background: #f1f5f9;
  color: #334155;
  border: 1px dashed rgba(42, 123, 136, 0.4);
}
</style>
