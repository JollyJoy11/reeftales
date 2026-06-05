<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, RouterLink } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import JournalEncountersDisplay from '@/components/journals/JournalEncountersDisplay.vue'
import JournalEngagementPanel from '@/components/journals/JournalEngagementPanel.vue'
import JournalMediaShowcase from '@/components/journals/JournalMediaShowcase.vue'
import JournalTimelineDisplay from '@/components/journals/JournalTimelineDisplay.vue'
import ScrapbookBoard from '@/components/journals/ScrapbookBoard.vue'
import { addJournalComment, getJournalById, toggleJournalLike } from '@/services/journalService'
import { toggleSavedJournal } from '@/services/savedJournalService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

const route = useRoute()
const authStore = useAuthStore()
const toastStore = useToastStore()
const { t } = useI18n()

const journal = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const selectedTimelineDay = ref(null)
const selectedMediaId = ref('cover')
const commentText = ref('')
const engagementLoading = ref(false)
const hasLiked = ref(false)
const hasSaved = ref(false)

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

  const mediaPositions = [
    {
      xPct: 0.08,
      yPct: 0.10,
      wPct: 0.46,
      hPct: 0.28,
      rotation: -3,
      attachment: 'clip'
    },
    {
      xPct: 0.48,
      yPct: 0.42,
      wPct: 0.40,
      hPct: 0.25,
      rotation: 3,
      attachment: 'tape'
    },
    {
      xPct: 0.14,
      yPct: 0.62,
      wPct: 0.36,
      hPct: 0.23,
      rotation: 2,
      attachment: 'tape'
    }
  ]

  const mediaItems = (journal.value.media || []).slice(0, 3).map((media, index) => ({
    id: `default-media-${media.id}`,
    type: 'media',
    mediaId: media.id,
    previewUrl: media.media_url,
    mediaUrl: media.media_url,
    mediaType: media.media_type,
    caption: media.caption,
    attachment: mediaPositions[index].attachment,
    tapeColor: ['#a9d8d6', '#f3c3c7', '#f5df9a'][index],
    tapePlacement: ['top-left', 'top-center', 'top-right'][index],
    rotation: mediaPositions[index].rotation,
    zIndex: index + 2,
    xPct: mediaPositions[index].xPct,
    yPct: mediaPositions[index].yPct,
    wPct: mediaPositions[index].wPct,
    hPct: mediaPositions[index].hPct
  }))

  const items = [...mediaItems]

  if (!mediaItems.length) {
    items.push({
      id: 'default-note',
      type: 'text',
      text: journal.value.content?.slice(0, 80) || 'Write a small memory...',
      textColor: '#fff8d9',
      rotation: -2,
      zIndex: 2,
      xPct: 0.18,
      yPct: 0.22,
      wPct: 0.52,
      hPct: 0.16
    })
  }

  items.push({
    id: 'default-mood',
    type: 'mood',
    stickerText: activeMood.value.label.toUpperCase(),
    stickerColor: activeMood.value.color,
    stickerShape: 'ticket',
    mood: journal.value.mood,
    rotation: 4,
    zIndex: 20,
    xPct: 0.58,
    yPct: 0.12,
    wPct: 0.26,
    hPct: 0.13
  })

  return items
})

const boardItems = computed(() => {
  const items = journal.value?.layout_items?.length
    ? journal.value.layout_items
    : defaultBoardItems.value

  const mediaList = journal.value?.media || []
  const mediaById = new Map(mediaList.map(media => [String(media.id), media]))
  const usedMediaIds = new Set()

  function pickUnusedMedia(predicate) {
    return mediaList.find(media => (
      !usedMediaIds.has(String(media.id)) &&
      predicate(media)
    ))
  }

  return items.map(item => {
    if (item.type !== 'media') return item

    const exactIdMatch = item.mediaId ? mediaById.get(String(item.mediaId)) : null
    const sourceMedia = (
      exactIdMatch && !usedMediaIds.has(String(exactIdMatch.id))
        ? exactIdMatch
        : null
    ) ||
      pickUnusedMedia(media => (
        media.media_url === item.mediaUrl ||
        media.media_url === item.previewUrl
      )) ||
      pickUnusedMedia(media => (
        media.media_type === item.mediaType &&
        item.caption &&
        media.caption === item.caption
      )) ||
      pickUnusedMedia(media => media.media_type === item.mediaType) ||
      pickUnusedMedia(() => true)

    if (!sourceMedia) {
      return item
    }

    usedMediaIds.add(String(sourceMedia.id))

    return {
      ...item,
      originalMediaId: item.mediaId,
      mediaId: sourceMedia.id,
      mediaType: item.mediaType || sourceMedia.media_type,
      mediaUrl: item.mediaUrl || sourceMedia.media_url
    }
  })
})

const boardIsDefault = computed(() => {
  return !journal.value?.layout_items?.length
})

const coverImage = computed(() => {
  return journal.value?.cover_image ||
    journal.value?.island_cover_image ||
    '/images/island-placeholder.jpg'
})

function normalizeMediaUrl(url) {
  if (!url) return ''

  return String(url)
    .split('?')[0]
    .replace(/^https?:/, '')
    .replace(/\/+$/, '')
}

const timelineDays = computed(() => {
  const groups = new Map()

  for (const activity of journal.value?.activities || []) {
    const dayNumber = activity.day_number || 1

    if (!groups.has(dayNumber)) {
      groups.set(dayNumber, [])
    }

    groups.get(dayNumber).push(activity)
  }

  return [...groups.entries()].map(([dayNumber, activities]) => ({
    dayNumber,
    activities
  }))
})

const mediaStripItems = computed(() => {
  const normalizedCoverUrl = normalizeMediaUrl(coverImage.value)
  const uploadedMedia = (journal.value?.media || [])
    .filter(media => normalizeMediaUrl(media.media_url) !== normalizedCoverUrl)
    .map((media, index) => ({
      id: media.id,
      url: media.media_url,
      label: `Media ${index + 1}`,
      type: media.media_type || 'photo'
    }))

  const items = [
    {
      id: 'cover',
      url: coverImage.value,
      label: 'Cover',
      type: 'photo'
    },
    ...uploadedMedia
  ]

  return items.filter(item => item.url)
})

const selectedMedia = computed(() => {
  return mediaStripItems.value.find(item => String(item.id) === String(selectedMediaId.value)) ||
    mediaStripItems.value[0]
})

const selectedBoardMediaId = computed(() => {
  return selectedMedia.value?.id === 'cover' ? null : selectedMedia.value?.id
})

function selectMedia(mediaId) {
  selectedMediaId.value = mediaId
}

async function handleLike() {
  if (!authStore.isLoggedIn) {
    toastStore.danger(t('toast.likeJournalLogin'))
    return
  }

  try {
    engagementLoading.value = true
    const response = await toggleJournalLike(journal.value.id)
    const currentCount = Number(journal.value.like_count || 0)
    hasLiked.value = response.liked
    journal.value.like_count = response.liked
      ? currentCount + 1
      : Math.max(0, currentCount - 1)
  } catch {
    toastStore.danger(t('toast.likeJournalError'))
  } finally {
    engagementLoading.value = false
  }
}

async function handleSave() {
  if (!authStore.isLoggedIn) {
    toastStore.danger(t('toast.saveJournalLogin'))
    return
  }

  try {
    engagementLoading.value = true
    const response = await toggleSavedJournal(journal.value.id)
    hasSaved.value = response.saved
    toastStore.success(response.saved ? t('toast.journalSaved') : t('toast.journalRemoved'))
  } catch {
    toastStore.danger(t('toast.saveJournalError'))
  } finally {
    engagementLoading.value = false
  }
}

async function handleComment() {
  const content = commentText.value.trim()

  if (!authStore.isLoggedIn) {
    toastStore.danger(t('toast.commentLogin'))
    return
  }

  if (!content) {
    toastStore.danger(t('toast.commentRequired'))
    return
  }

  try {
    engagementLoading.value = true
    await addJournalComment(journal.value.id, content)
    commentText.value = ''
    journal.value = await getJournalById(route.params.id)
    hasLiked.value = Boolean(journal.value.is_liked || journal.value.liked)
    hasSaved.value = Boolean(journal.value.is_saved || journal.value.saved)
  } catch {
    toastStore.danger(t('toast.commentError'))
  } finally {
    engagementLoading.value = false
  }
}

async function loadJournal() {
  try {
    loading.value = true
    journal.value = await getJournalById(route.params.id)

    document.title = `${journal.value.title} | ReefTales`

    selectedTimelineDay.value = null
    selectedMediaId.value = 'cover'

    hasLiked.value = Boolean(journal.value.is_liked || journal.value.liked)
    hasSaved.value = Boolean(journal.value.is_saved || journal.value.saved)
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
      <LoadingState
        v-if="loading"
        message="Loading journal details..."
      />

      <div v-else-if="journal" class="journal-book-shell">
        <div class="journal-page journal-left-page">
          <div class="detail-top-row">
            <RouterLink to="/community" class="back-link">
              <i class="bi bi-arrow-left"></i>
              Community Diaries
            </RouterLink>

            <span class="detail-date">
              <i class="bi bi-calendar-heart"></i>
              {{ dateText }}
            </span>
          </div>

          <JournalMediaShowcase
            :media-items="mediaStripItems"
            :selected-media-id="selectedMediaId"
            :cover-image="coverImage"
            @update:selected-media-id="selectMedia"
          />

          <span class="journal-kicker">
            {{ journal.island_name }} · {{ journal.country }}
          </span>

          <h1>{{ journal.title }}</h1>

          <div class="journal-meta">
            <span><i class="bi bi-palette2"></i> {{ journal.mood }}</span>
            <span><i class="bi bi-person-circle"></i> {{ journal.username }}</span>
          </div>

          <p class="journal-story">
            {{ journal.content }}
          </p>

          <JournalTimelineDisplay
            :days="timelineDays"
            :selected-day="selectedTimelineDay"
            @update:selected-day="selectedTimelineDay = $event"
          />

          <JournalEncountersDisplay :sightings="journal.sightings || []" />
        </div>

        <div class="journal-page journal-right-page">
          <div class="board-title-row">
            <h2>Memory Board</h2>
            <span>{{ boardItems.length }} pieces</span>
          </div>

          <ScrapbookBoard
            class="detail-scrapbook-board"
            :items="boardItems"
            :active-media-id="selectedBoardMediaId"
            @media-select="selectMedia"
          />

          <JournalEngagementPanel
            :journal="journal"
            :auth-user="authStore.user"
            v-model:comment-text="commentText"
            :loading="engagementLoading"
            :has-liked="hasLiked"
            :has-saved="hasSaved"
            @like="handleLike"
            @save="handleSave"
            @comment="handleComment"
          />
        </div>
      </div>

      <EmptyState
        v-else
        icon="bi bi-journal-x"
        title="Journal not available"
        :message="errorMessage || 'This diary may have been deleted, moved, or set to private.'"
      >
        <template #actions>
          <RouterLink to="/community">
            <i class="bi bi-arrow-left"></i>
            Browse community diaries
          </RouterLink>
        </template>
      </EmptyState>
    </section>
  </MainLayout>
</template>

<style scoped>
.journal-loading {
  color: var(--text-secondary);
  font-weight: 800;
}

.journal-book-shell {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.1fr);
  gap: 0;
  align-items: stretch;
  min-width: 0;
  padding: 10px;
  border-radius: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.12);
}

.journal-page {
  min-width: 0;
  padding: 24px;
  min-height: 760px;
  background:
    radial-gradient(circle at top left, rgba(169,216,214,0.28), transparent 34%),
    linear-gradient(180deg, var(--surface-soft) 0%, var(--page-bg) 100%);
}

.journal-left-page {
  border-radius: 16px 0 0 16px;
  border-right: 1px dashed var(--border);
  box-shadow: inset -18px 0 28px rgba(196,164,132,0.08);
}

.journal-right-page {
  border-radius: 0 16px 16px 0;
  box-shadow: inset 18px 0 28px rgba(196,164,132,0.06);
}

.detail-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--accent);
  font-weight: 800;
  text-decoration: none;
}

.detail-date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--accent);
  border: 1px dashed rgba(24,151,160,0.4);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.78rem;
  font-weight: 900;
  white-space: nowrap;
}

.journal-kicker {
  color: var(--accent);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
}

.journal-left-page h1 {
  color: var(--text-primary);
  font-weight: 900;
  margin: 8px 0 12px;
  overflow-wrap: anywhere;
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
  max-width: 100%;
}

.journal-story {
  color: #55677d;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.detail-scrapbook-board {
  width: min(100%, 560px);
  max-width: 560px;
  aspect-ratio: 4 / 4.8;
  margin-inline: auto;
}

.detail-scrapbook-board :deep(.scrapbook-item-card.type-media) {
  padding: 10px 10px 42px;
}

.detail-scrapbook-board :deep(.scrapbook-item-card.selected) {
  transform:
    rotate(var(--item-rotation))
    translateY(-4px)
    scale(1.03);
  box-shadow:
    0 18px 30px rgba(0,0,0,0.18),
    0 0 0 4px rgba(24,151,160,0.12),
    0 0 26px rgba(24,151,160,0.22);
}


.board-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.board-title-row span {
  color: var(--text-secondary);
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
    border-bottom: 1px dashed var(--border);
  }

  .journal-right-page {
    border-radius: 0 0 16px 16px;
  }

  .detail-top-row {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .journal-book-shell {
    padding: 8px;
    border-radius: 20px;
  }

  .journal-page {
    padding: 18px;
  }

  .journal-left-page h1 {
    font-size: clamp(2rem, 8vw, 2.85rem);
    line-height: 1.05;
  }

  .journal-meta {
    gap: 6px;
  }

  .journal-meta span {
    width: fit-content;
  }

  .board-title-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .detail-scrapbook-board {
    width: min(100%, 430px);
    max-width: 430px;
    aspect-ratio: 4 / 5.3;
    overflow: hidden;
  }

  .detail-scrapbook-board :deep(.scrapbook-item.type-sticker.positioned),
  .detail-scrapbook-board :deep(.scrapbook-item.type-mood.positioned) {
    max-width: 96px;
    max-height: 74px;
  }
}

@media (max-width: 576px) {
  .journal-book-shell {
    padding: 6px;
    border-radius: 16px;
  }

  .journal-page {
    padding: 14px;
  }

  .journal-left-page {
    border-radius: 12px 12px 0 0;
  }

  .journal-right-page {
    border-radius: 0 0 12px 12px;
  }

  .detail-top-row {
    gap: 8px;
  }

  .detail-date {
    white-space: normal;
  }

  .journal-meta span {
    font-size: 0.72rem;
    padding: 5px 8px;
  }

  .detail-scrapbook-board :deep(.scrapbook-item-card.type-media) {
    padding: 8px 8px 34px;
  }

  .detail-scrapbook-board :deep(.scrapbook-item.type-sticker.positioned),
  .detail-scrapbook-board :deep(.scrapbook-item.type-mood.positioned) {
    max-width: 82px;
    max-height: 62px;
  }

  .detail-scrapbook-board :deep(.scrapbook-item-card.type-sticker),
  .detail-scrapbook-board :deep(.scrapbook-item-card.type-mood) {
    transform:
      rotate(var(--item-rotation))
      scale(0.92);
  }
}

</style>
