<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import ScrapbookBoard from '@/components/journals/ScrapbookBoard.vue'
import { getJournalById } from '@/services/journalService'

const route = useRoute()

const journal = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const moodStickers = {
  joyful: { label: 'Joyful', color: '#d96c82' },
  relaxed: { label: 'Relaxed', color: '#2a9d8f' },
  amazed: { label: 'Amazed', color: '#c9912e' },
  adventurous: { label: 'Adventure', color: '#7c68b5' },
  peaceful: { label: 'Peaceful', color: '#5fa87f' },
  tired: { label: 'Tired', color: '#7f929c' },
  excited: { label: 'Excited', color: '#d96c82' }
}

const dateText = computed(() => {
  if (!journal.value?.start_date && !journal.value?.end_date) return 'Date not recorded'

  const start = journal.value.start_date
    ? new Date(journal.value.start_date).toLocaleDateString()
    : ''
  const end = journal.value.end_date
    ? new Date(journal.value.end_date).toLocaleDateString()
    : ''

  if (!end || start === end) return start
  return `${start} - ${end}`
})

const activeMood = computed(() => {
  return moodStickers[journal.value?.mood] || moodStickers.peaceful
})

const defaultBoardItems = computed(() => {
  if (!journal.value) return []

  const mediaItems = (journal.value.media || []).slice(0, 4).map((media, index) => ({
    id: `default-media-${media.id}`,
    type: 'media',
    previewUrl: media.media_url,
    mediaType: media.media_type,
    caption: media.caption,
    attachment: index % 3 === 0 ? 'clip' : 'tape',
    tapeColor: ['#a9d8d6', '#f3c3c7', '#f5df9a', '#b9d7a8'][index % 4],
    rotation: index % 2 === 0 ? -3 : 3,
    zIndex: index + 1,
    xPct: [0.08, 0.48, 0.14, 0.52][index] || 0.12,
    yPct: [0.09, 0.18, 0.48, 0.58][index] || 0.2,
    wPct: 0.34,
    hPct: 0.25
  }))

  return [
    ...mediaItems,
    {
      id: 'default-mood',
      type: 'mood',
      stickerText: activeMood.value.label.toUpperCase(),
      stickerColor: activeMood.value.color,
      stickerShape: 'ticket',
      mood: journal.value.mood,
      rotation: 4,
      zIndex: 20,
      xPct: 0.58,
      yPct: 0.04,
      wPct: 0.25,
      hPct: 0.13
    }
  ]
})

const boardItems = computed(() => {
  return journal.value?.layout_items?.length
    ? journal.value.layout_items
    : defaultBoardItems.value
})

const boardIsDefault = computed(() => {
  return !journal.value?.layout_items?.length
})

async function loadJournal() {
  try {
    loading.value = true
    journal.value = await getJournalById(route.params.id)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to load journal.'
  } finally {
    loading.value = false
  }
}

onMounted(loadJournal)
</script>

<template>
  <MainLayout>
    <AppAlert
      v-if="errorMessage"
      :message="errorMessage"
      variant="danger"
      @close="errorMessage = ''"
    />

    <section class="container py-4">
      <div v-if="loading" class="journal-loading">
        Loading journal...
      </div>

      <div v-else-if="journal" class="journal-book-shell">
        <div class="journal-page journal-left-page">
          <RouterLink to="/community" class="back-link">
            <i class="bi bi-arrow-left"></i>
            Community Diaries
          </RouterLink>

          <img
            :src="journal.cover_image || '/images/island-placeholder.jpg'"
            class="journal-cover"
            alt="Journal cover"
          />

          <span class="journal-kicker">
            {{ journal.island_name }} · {{ journal.country }}
          </span>

          <h1>{{ journal.title }}</h1>

          <div class="journal-meta">
            <span><i class="bi bi-calendar-heart"></i> {{ dateText }}</span>
            <span><i class="bi bi-palette2"></i> {{ journal.mood }}</span>
            <span><i class="bi bi-person-circle"></i> {{ journal.username }}</span>
          </div>

          <p class="journal-story">
            {{ journal.content }}
          </p>

          <div class="detail-section" v-if="journal.activities?.length">
            <h2>Timeline</h2>
            <div
              v-for="activity in journal.activities"
              :key="activity.id"
              class="detail-list-item"
            >
              <strong>Day {{ activity.day_number || 1 }}</strong>
              <span>
                {{ activity.activity_name || activity.custom_activity_name || 'Activity' }}
                <template v-if="activity.activity_time"> · {{ activity.activity_time }}</template>
              </span>
              <small v-if="activity.notes">{{ activity.notes }}</small>
            </div>
          </div>

          <div class="detail-section" v-if="journal.sightings?.length">
            <h2>Encounters</h2>
            <div
              v-for="sighting in journal.sightings"
              :key="sighting.id"
              class="detail-list-item"
            >
              <strong>{{ sighting.species_name || sighting.custom_species_name || 'Marine life' }}</strong>
              <span>Quantity: {{ sighting.quantity || 1 }}</span>
              <small v-if="sighting.notes">{{ sighting.notes }}</small>
            </div>
          </div>
        </div>

        <div class="journal-page journal-right-page">
          <div class="board-title-row">
            <h2>Memory Board</h2>
            <span>{{ boardIsDefault ? 'Auto layout' : `${boardItems.length} pieces` }}</span>
          </div>

          <ScrapbookBoard :items="boardItems" />
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<style scoped>
.journal-loading {
  color: #64748b;
  font-weight: 800;
}

.journal-book-shell {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.1fr);
  gap: 0;
  align-items: stretch;
  padding: 10px;
  border-radius: 24px;
  background: repeating-linear-gradient(
    135deg,
    #e85d5d 0 12px,
    #ffffff 12px 24px,
    #2c9ab7 24px 36px,
    #ffffff 36px 48px
  );
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.12);
}

.journal-page {
  background: #fffdf8;
  padding: 24px;
  min-height: 760px;
}

.journal-left-page {
  border-radius: 16px 0 0 16px;
  border-right: 1px dashed #d8cdbb;
  box-shadow: inset -18px 0 28px rgba(196,164,132,0.08);
}

.journal-right-page {
  border-radius: 0 16px 16px 0;
  box-shadow: inset 18px 0 28px rgba(196,164,132,0.06);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  color: #1897a0;
  font-weight: 800;
  text-decoration: none;
}

.journal-cover {
  width: 100%;
  aspect-ratio: 1.35;
  object-fit: cover;
  border: 10px solid #fbf9f1;
  box-shadow: 0 10px 24px rgba(0,0,0,0.12);
  margin-bottom: 18px;
}

.journal-kicker {
  color: #1897a0;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
}

.journal-left-page h1 {
  color: #2f4858;
  font-weight: 900;
  margin: 8px 0 12px;
}

.journal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.journal-meta span {
  border: 1px dashed rgba(24,151,160,0.4);
  border-radius: 999px;
  padding: 6px 10px;
  color: #1f4e5f;
  font-size: 0.8rem;
  font-weight: 800;
}

.journal-story {
  color: #55677d;
  line-height: 1.7;
}

.detail-section {
  margin-top: 22px;
}

.detail-section h2,
.board-title-row h2 {
  color: #2f4858;
  font-size: 1.05rem;
  font-weight: 900;
  margin-bottom: 12px;
}

.detail-list-item {
  border-top: 1px dashed #eadfca;
  padding: 10px 0;
  display: grid;
  gap: 2px;
}

.detail-list-item strong {
  color: #1f4e5f;
}

.detail-list-item span,
.detail-list-item small {
  color: #64748b;
}

.board-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.board-title-row span {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
}

@media (max-width: 992px) {
  .journal-book-shell {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .journal-left-page,
  .journal-right-page {
    min-height: auto;
    border-radius: 0;
    border-right: none;
  }

  .journal-left-page {
    border-radius: 16px 16px 0 0;
    border-bottom: 1px dashed #d8cdbb;
  }

  .journal-right-page {
    border-radius: 0 0 16px 16px;
  }
}
</style>
