<script setup>
import { computed } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  islands: { type: Array, default: () => [] }
})

const selectedIsland = computed(() => {
  return props.islands.find(island => Number(island.id) === Number(props.form.island_id))
})

const moodMap = {
  joyful: { label: 'Joyful', color: '#ff8fab' },
  relaxed: { label: 'Relaxed', color: '#2a9d8f' },
  amazed: { label: 'Amazed', color: '#f4b942' },
  adventurous: { label: 'Adventurous', color: '#a78bfa' },
  peaceful: { label: 'Peaceful', color: '#74c69d' },
  tired: { label: 'Tired', color: '#90a4ae' }
}

const activeMood = computed(() => {
  return moodMap[props.form.mood] || moodMap.joyful
})

const hasVideoCover = computed(() => {
  return props.form.coverImage?.mediaType === 'video'
})

const includedItems = computed(() => [
  {
    label: 'Cover',
    active: Boolean(props.form.coverImage),
    icon: 'bi bi-image'
  },
  {
    label: 'Story',
    active: Boolean(props.form.content),
    icon: 'bi bi-journal-text'
  },
  {
    label: 'Timeline',
    active: props.form.timeline.length > 0,
    icon: 'bi bi-clock-history'
  },
  {
    label: 'Encounters',
    active: props.form.sightings.length > 0,
    icon: 'bi bi-stars'
  },
  {
    label: 'Media gallery',
    active: props.form.media.length > 0,
    icon: 'bi bi-images'
  },
  {
    label: 'Memory board',
    active: props.form.layoutItems?.length > 0,
    icon: 'bi bi-layout-wtf'
  }
])

const dateText = computed(() => {
  const start = props.form.trip_dates?.[0]
  const end = props.form.trip_dates?.[1]

  if (!start && !end) return 'Voyage date not selected'

  const startText = start ? new Date(start).toLocaleDateString() : ''
  const endText = end ? new Date(end).toLocaleDateString() : ''

  if (!end || startText === endText) return startText

  return `${startText} - ${endText}`
})

const coverPreviewAlt = computed(() => {
  const title = props.form.title || 'Untitled journal'
  const island = selectedIsland.value?.name ? ` for ${selectedIsland.value.name}` : ''

  return `Cover preview for ${title}${island}`
})
</script>

<template>
  <section class="journal-preview-card">
    <div class="preview-kicker">
      <i class="bi bi-eye"></i>
      Live Journal Preview
    </div>

    <div class="row g-4 align-items-center">
      <div class="col-12 col-lg-5 d-flex justify-content-center">
        <div class="preview-polaroid">
          <span v-if="hasVideoCover" class="video-cover-badge">
            <i class="bi bi-play-fill"></i>
            Video cover
          </span>

          <img
            :src="form.coverImage?.previewUrl || selectedIsland?.cover_image || '/images/island-placeholder.jpg'"
          />

          <div class="polaroid-caption">
            <i class="bi bi-calendar-heart"></i>
            {{ dateText }}
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-7">
        <div class="preview-narrative">
          <div class="preview-topline">
            <span class="island-name">
              <i class="bi bi-geo-alt-fill"></i>
              {{ selectedIsland?.name || 'Selected island' }}
            </span>

            <span
              class="mini-mood"
              :style="{ backgroundColor: activeMood.color }"
            >
              {{ activeMood.label }}
            </span>
          </div>

          <h2>{{ form.title || 'Untitled journal' }}</h2>

          <div class="story-block">
            <span>Story excerpt</span>
            <p class="story-preview">
              {{ form.content || 'Your travel story will appear here...' }}
            </p>
          </div>

          <div class="preview-stamps">
            <span><i class="bi bi-palette2"></i> {{ activeMood.label }}</span>
            <span><i class="bi bi-images"></i> {{ form.media.length }} Media</span>
            <span><i class="bi bi-map"></i> {{ form.timeline.length }} Activities</span>
            <span><i class="bi bi-stars"></i> {{ form.sightings.length }} Encounters</span>
            <span><i class="bi bi-layout-wtf"></i> {{ form.layoutItems?.length || 0 }} Arranged</span>
            <span>
              <i :class="form.is_public ? 'bi bi-globe2' : 'bi bi-lock-fill'"></i>
              {{ form.is_public ? 'Public' : 'Private' }}
            </span>
          </div>

          <div class="included-panel">
            <span class="included-title">Included in this journal</span>

            <div class="included-grid">
              <span
                v-for="item in includedItems"
                :key="item.label"
                class="included-item"
                :class="{ active: item.active }"
              >
                <i :class="item.active ? 'bi bi-check-circle-fill' : item.icon"></i>
                {{ item.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.journal-preview-card {
  background: var(--surface-soft);
  border: 1px dashed #eadfca;
  border-radius: 24px;
  padding: 28px;
  box-shadow: inset 0 0 30px rgba(196,164,132,0.06);
}

.preview-kicker {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 18px;
}

.preview-polaroid {
  position: relative;
  width: min(310px, 100%);
  background: white;
  padding: 14px 14px 28px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.14);
  transform: rotate(-2deg);
}

.video-cover-badge {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(31, 78, 95, 0.86);
  color: white;
  font-size: 0.72rem;
  font-weight: 800;
}

.preview-polaroid img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border: 2px solid #475569;
  background: #f6f3eb;
}

.polaroid-caption {
  margin-top: 12px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
}

.preview-narrative {
  background: var(--surface);
  border-radius: 22px;
  padding: 24px;
  border: 1px solid #eadfca;
}

.preview-topline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}

.island-name {
  color: var(--accent);
  font-weight: 800;
}

.mini-mood {
  color: white;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  box-shadow: 0 6px 14px rgba(0,0,0,0.12);
}

.preview-narrative h2 {
  color: var(--text-primary);
  font-weight: 900;
  margin-bottom: 10px;
}

.story-block {
  margin-top: 14px;
}

.story-block > span {
  display: block;
  margin-bottom: 6px;
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.story-preview {
  color: #55677d;
  line-height: 1.65;
  margin: 0;
  display: -webkit-box;
  line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.preview-stamps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.preview-stamps span {
  background: transparent;
  color: #1f4e5f;
  border: 1px dashed rgba(42,123,136,0.45);
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 800;
}

.included-panel {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #eadfca;
}

.included-title {
  display: block;
  margin-bottom: 10px;
  color: #7c6f63;
  font-size: 0.8rem;
  font-weight: 800;
}

.included-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.included-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--surface-soft);
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 700;
}

.included-item.active {
  background: var(--accent-soft);
  color: #0f766e;
}

@media (max-width: 768px) {
  .preview-topline {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
