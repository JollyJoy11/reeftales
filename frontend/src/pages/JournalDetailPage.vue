<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppStampFrame from '@/components/common/AppStampFrame.vue'
import ScrapbookBoard from '@/components/journals/ScrapbookBoard.vue'
import { addJournalComment, getJournalById, toggleJournalLike } from '@/services/journalService'
import { toggleSavedJournal } from '@/services/savedJournalService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

const route = useRoute()
const authStore = useAuthStore()
const toastStore = useToastStore()

const journal = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const selectedTimelineDay = ref(null)
const selectedMediaId = ref('cover')
const commentText = ref('')
const engagementLoading = ref(false)
const mediaStripRef = ref(null)
const canScrollMediaUp = ref(false)
const canScrollMediaDown = ref(false)
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
    }
  ]

  const mediaItems = (journal.value.media || []).slice(0, 2).map((media, index) => ({
    id: `default-media-${media.id}`,
    type: 'media',
    mediaId: media.id,
    previewUrl: media.media_url,
    mediaUrl: media.media_url,
    mediaType: media.media_type,
    caption: media.caption,
    attachment: mediaPositions[index].attachment,
    tapeColor: ['#a9d8d6', '#f3c3c7'][index],
    tapePlacement: ['top-left', 'top-center'][index],
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
    yPct: 0.10,
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

const activeTimelineDay = computed(() => {
  if (!timelineDays.value.length) return null

  return timelineDays.value.find(day => day.dayNumber === selectedTimelineDay.value) ||
    timelineDays.value[0]
})

const mediaStripItems = computed(() => {
  const items = [
    {
      id: 'cover',
      url: coverImage.value,
      label: 'Cover',
      type: 'photo'
    },
    ...(journal.value?.media || []).map((media, index) => ({
      id: media.id,
      url: media.media_url,
      label: `Media ${index + 1}`,
      type: media.media_type || 'photo'
    }))
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

function activityTitle(activity) {
  return activity.activity_name || activity.custom_activity_name || 'Activity'
}

function formatActivityTime(time) {
  if (!time) return ''
  return String(time).slice(0, 5)
}

function sightingName(sighting) {
  return sighting.species_name || sighting.custom_species_name || 'Marine life'
}

function sightingQuantity(sighting) {
  const quantity = Number(sighting.quantity || 1)
  return `${quantity} ${quantity === 1 ? 'encounter' : 'encounters'}`
}

function scrollMediaStrip(direction) {
  mediaStripRef.value?.scrollBy({
    top: direction * 92,
    behavior: 'smooth'
  })
}

function updateMediaScrollState() {
  const strip = mediaStripRef.value
  if (!strip) return

  canScrollMediaUp.value = strip.scrollTop > 2
  canScrollMediaDown.value = strip.scrollTop + strip.clientHeight < strip.scrollHeight - 2
}

function selectMedia(mediaId) {
  selectedMediaId.value = mediaId
}

async function handleLike() {
  if (!authStore.isLoggedIn) {
    toastStore.danger('Please login to like journals.')
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
    toastStore.danger('Unable to update like.')
  } finally {
    engagementLoading.value = false
  }
}

async function handleSave() {
  if (!authStore.isLoggedIn) {
    toastStore.danger('Please login to save journals.')
    return
  }

  try {
    engagementLoading.value = true
    const response = await toggleSavedJournal(journal.value.id)
    hasSaved.value = response.saved
    toastStore.success(response.saved ? 'Journal saved.' : 'Removed from saved journals.')
  } catch {
    toastStore.danger('Unable to update saved journal.')
  } finally {
    engagementLoading.value = false
  }
}

async function handleComment() {
  const content = commentText.value.trim()

  if (!authStore.isLoggedIn) {
    toastStore.danger('Please login to comment.')
    return
  }

  if (!content) {
    toastStore.danger('Please write a comment first.')
    return
  }

  try {
    engagementLoading.value = true
    await addJournalComment(journal.value.id, content)
    commentText.value = ''
    journal.value = await getJournalById(route.params.id)
  } catch {
    toastStore.danger('Unable to post comment.')
  } finally {
    engagementLoading.value = false
  }
}

async function loadJournal() {
  try {
    loading.value = true
    journal.value = await getJournalById(route.params.id)
    selectedTimelineDay.value = null
    selectedMediaId.value = 'cover'
    hasLiked.value = false
    hasSaved.value = false
    await nextTick()
    updateMediaScrollState()
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

          <div class="cover-media-cluster">
            <div class="media-strip-shell">
              <button
                type="button"
                class="media-scroll-btn top"
                aria-label="Scroll media up"
                :disabled="!canScrollMediaUp"
                @click="scrollMediaStrip(-1)"
              >
                <i class="bi bi-chevron-up"></i>
              </button>

              <div
                ref="mediaStripRef"
                class="media-side-strip"
                aria-label="Journal media"
                @scroll="updateMediaScrollState"
              >
                <button
                  v-for="item in mediaStripItems"
                  :key="item.id"
                  type="button"
                  class="media-thumb"
                  :class="{ active: String(selectedMedia?.id) === String(item.id) }"
                  @click="selectMedia(item.id)"
                >
                  <AppStampFrame
                    :image="item.type === 'video' ? '' : item.url"
                    :alt="item.label"
                    :active="String(selectedMedia?.id) === String(item.id)"
                    clickable
                    contain
                    @load="updateMediaScrollState"
                    @error="$event.target.src = '/images/island-placeholder.jpg'"
                  >
                    <span v-if="item.type === 'video'" class="media-video-thumb">
                      <video :src="item.url" muted playsinline preload="metadata"></video>
                      <i class="bi bi-play-fill"></i>
                    </span>
                  </AppStampFrame>
                </button>
              </div>

              <button
                type="button"
                class="media-scroll-btn bottom"
                aria-label="Scroll media down"
                :disabled="!canScrollMediaDown"
                @click="scrollMediaStrip(1)"
              >
                <i class="bi bi-chevron-down"></i>
              </button>
            </div>

            <div class="journal-cover-frame">
              <Transition name="media-swap" mode="out-in">
                <video
                  v-if="selectedMedia?.type === 'video'"
                  :key="`video-${selectedMedia?.id}`"
                  :src="selectedMedia?.url"
                  class="journal-cover journal-cover-video"
                  controls
                  playsinline
                  preload="metadata"
                ></video>
                <img
                  v-else
                  :key="`image-${selectedMedia?.id}`"
                  :src="selectedMedia?.url || coverImage"
                  class="journal-cover"
                  alt="Selected journal media"
                  @error="$event.target.src = '/images/island-placeholder.jpg'"
                />
              </Transition>
            </div>
          </div>

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

          <div class="detail-section timeline-section" v-if="timelineDays.length">
            <h2>Timeline</h2>
            <div class="timeline-day-tabs">
              <button
                v-for="day in timelineDays"
                :key="day.dayNumber"
                type="button"
                :class="{ active: activeTimelineDay?.dayNumber === day.dayNumber }"
                @click="selectedTimelineDay = day.dayNumber"
              >
                Day {{ day.dayNumber }}
              </button>
            </div>
            <Transition name="timeline-slide" mode="out-in">
              <div
                v-if="activeTimelineDay"
                :key="activeTimelineDay.dayNumber"
                class="timeline-log"
              >
                <article
                  v-for="(activity, index) in activeTimelineDay.activities"
                  :key="activity.id"
                  class="timeline-entry"
                  :class="{ last: index === activeTimelineDay.activities.length - 1 }"
                >
                  <div class="timeline-rail">
                    <span class="timeline-dot" :class="{ hollow: index > 0 }"></span>
                  </div>
                  <div class="timeline-card">
                    <span class="timeline-icon">
                      <i class="bi bi-compass"></i>
                    </span>
                    <div>
                      <strong>{{ activityTitle(activity) }}</strong>
                      <small v-if="activity.notes">{{ activity.notes }}</small>
                    </div>
                    <time v-if="activity.activity_time">
                      {{ formatActivityTime(activity.activity_time) }}
                    </time>
                  </div>
                </article>
              </div>
            </Transition>
            <div
              v-for="activity in journal.activities"
              :key="activity.id"
              class="detail-list-item legacy-timeline-item"
            >
              <strong>Day {{ activity.day_number || 1 }}</strong>
              <span>
                {{ activity.activity_name || activity.custom_activity_name || 'Activity' }}
                <template v-if="activity.activity_time"> · {{ activity.activity_time }}</template>
              </span>
              <small v-if="activity.notes">{{ activity.notes }}</small>
            </div>
          </div>

          <div class="detail-section encounters-section" v-if="journal.sightings?.length">
            <div class="section-title-row">
              <h2>Encounters</h2>
              <span>{{ journal.sightings.length }} logged</span>
            </div>

            <div class="encounter-grid">
              <article
                v-for="(sighting, index) in journal.sightings"
                :key="sighting.id"
                class="encounter-card"
              >
                <span class="encounter-icon" :class="`tone-${index % 4}`">
                  <i class="bi bi-water"></i>
                </span>

                <div class="encounter-body">
                  <div class="encounter-heading">
                    <strong>{{ sightingName(sighting) }}</strong>
                    <span>{{ sightingQuantity(sighting) }}</span>
                  </div>
                  <p v-if="sighting.notes">{{ sighting.notes }}</p>
                  <p v-else class="muted-note">No notes added for this encounter.</p>
                </div>
              </article>
            </div>
          </div>
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

          <div class="traveler-notes-panel">
            <div class="traveler-notes-header">
              <div>
                <span class="notes-kicker">Traveler Notes</span>
                <h3>Leave a message in the guestbook</h3>
              </div>

              <span class="notes-count">
                {{ journal.comment_count || 0 }} notes
              </span>
            </div>

            <div class="engagement-actions">
              <button
                type="button"
                class="engagement-icon-btn"
                :class="{ active: hasLiked }"
                @click="handleLike"
                :disabled="engagementLoading"
              >
                <i :class="hasLiked ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
                {{ journal.like_count || 0 }}
              </button>
              <span class="engagement-count">
                <i class="bi bi-chat"></i>
                {{ journal.comment_count || 0 }}
              </span>
              <button
                type="button"
                class="engagement-icon-btn"
                :class="{ active: hasSaved }"
                @click="handleSave"
                :disabled="engagementLoading"
                title="Save journal"
              >
                <i :class="hasSaved ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'"></i>
              </button>
            </div>

            <div class="comment-compose">
              <div class="comment-avatar">
                {{ authStore.user?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </div>
              <div class="comment-input-wrap">
                <input
                  v-model="commentText"
                  type="text"
                  placeholder="Write a postcard note for this explorer..."
                  @keyup.enter="handleComment"
                />
                <button
                  type="button"
                  :disabled="engagementLoading || !commentText.trim()"
                  @click="handleComment"
                >
                  Post
                </button>
              </div>
            </div>

            <div v-if="journal.comments?.length" class="comment-list">
              <article
                v-for="comment in journal.comments"
                :key="comment.id"
                class="comment-item"
              >
                <div class="comment-avatar">
                  {{ comment.username?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
                <div>
                  <strong>{{ comment.username }}</strong>
                  <p>{{ comment.content }}</p>
                </div>
              </article>
            </div>
          </div>
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
  color: #1897a0;
  font-weight: 800;
  text-decoration: none;
}

.detail-date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1f4e5f;
  border: 1px dashed rgba(24,151,160,0.4);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.78rem;
  font-weight: 900;
}

.cover-media-cluster {
  display: grid;
  grid-template-columns: 93px minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
  margin-bottom: 18px;
}

.media-strip-shell {
  --media-strip-padding: 14px;
  --media-stamp-size: 78px;
  --media-strip-center: calc(var(--media-strip-padding) + (var(--media-stamp-size) / 2));

  position: relative;
  z-index: 2;
  transform: translateX(20px);
  box-shadow:
    6px 0 12px rgba(0,0,0,0.05);
}

.media-side-strip {
  display: grid;
  align-content: start;
  gap: 10px;
  max-height: 330px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 28px var(--media-strip-padding);
  scroll-padding-block: 28px;
  scrollbar-width: none;
}

.media-side-strip::-webkit-scrollbar {
  display: none;
}

.media-scroll-btn {
  position: absolute;
  left: var(--media-strip-center);
  z-index: 6;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: #1897a0;
  color: #ffffff;
  display: grid;
  place-items: center;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
  transition:
    background-color 0.16s ease,
    opacity 0.16s ease,
    transform 0.16s ease;
  box-shadow: 0 8px 18px rgba(47,72,88,0.16);
}

.media-scroll-btn.top {
  top: -8px;
}

.media-scroll-btn.bottom {
  bottom: -8px;
}

.media-strip-shell:hover .media-scroll-btn {
  opacity: 1;
  pointer-events: auto;
}

.media-scroll-btn:hover:not(:disabled) {
  background: #147d85;
  transform: translateX(-50%) translateY(-1px);
}

.media-scroll-btn:disabled {
  background: #b1c2ca;
  opacity: 0;
  cursor: not-allowed;
}

.media-thumb {
  border: none;
  background: transparent;
  padding: 4px 0;
  transition:
    transform 0.16s ease,
    filter 0.16s ease;
}

.media-thumb :deep(.app-stamp-frame) {
  width: var(--media-stamp-size);
  aspect-ratio: 1;
}

.media-video-thumb {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #102f3a;
  border: 1px solid rgba(47,72,88,0.18);
}

.media-video-thumb video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.media-video-thumb i {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(24,151,160,0.9);
  color: #ffffff;
  font-size: 1rem;
  box-shadow: 0 6px 14px rgba(47,72,88,0.2);
}

.media-thumb img {
  filter:
    saturate(0.88)
    contrast(0.96);
}

.media-thumb:nth-child(odd) {
  transform: rotate(-2deg);
}

.media-thumb:nth-child(even) {
  transform: rotate(2deg);
}

.media-thumb:hover,
.media-thumb.active {
  filter: drop-shadow(0 0 10px rgba(24,151,160,0.2));
  transform: rotate(0deg) translateY(-2px);
}

.journal-cover-frame {
  position: relative;
  background:
    linear-gradient(
      180deg,
      #fdfcf8 0%,
      #f5efe3 100%
    );
  padding: 16px;
  border: 1px solid rgba(196,164,132,0.25);
  box-shadow:
    0 14px 30px rgba(0,0,0,0.12),
    inset 0 0 18px rgba(255,255,255,0.4);
  border-radius: 4px;
  transform: rotate(-0.5deg);
}

.journal-cover {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  background: #f8f5ea;
}

.journal-cover-video {
  width: 100%;
  height: 100%;
  background: #102f3a;
}

.journal-cover-frame::before {
  content: '';
  position: absolute;
  top: -12px;
  left: 50%;
  width: 120px;
  height: 26px;
  transform:
    translateX(-50%)
    rotate(2deg);
  background: rgba(141, 185, 183, 0.28);
  backdrop-filter: blur(2px);
  border-left: 1px dashed rgba(0,0,0,0.12);
  border-right: 1px dashed rgba(0,0,0,0.12);
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

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title-row h2 {
  margin-bottom: 0;
}

.section-title-row span {
  color: #1897a0;
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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

.legacy-timeline-item {
  display: none;
}

.encounter-grid {
  display: grid;
  gap: 12px;
}

.encounter-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 14px;
  border: 1px solid #eadfca;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(222,239,236,0.82), rgba(255,253,248,0.92) 46%),
    #fffdf8;
  box-shadow: 0 10px 22px rgba(47,72,88,0.07);
}

.detail-scrapbook-board {
  max-width: 560px;
  aspect-ratio: 4 / 4.8;
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

.encounter-icon {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #ffffff;
  box-shadow: inset 0 -3px 0 rgba(47,72,88,0.12);
  transform: rotate(-4deg);
}

.encounter-icon.tone-0 {
  background: #1897a0;
}

.encounter-icon.tone-1 {
  background: #2a9d8f;
}

.encounter-icon.tone-2 {
  background: #5e8fb3;
}

.encounter-icon.tone-3 {
  background: #c9912e;
}

.encounter-body {
  min-width: 0;
}

.encounter-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.encounter-heading strong {
  color: #1f4e5f;
  font-weight: 900;
  line-height: 1.25;
}

.encounter-heading span {
  flex: 0 0 auto;
  border: 1px dashed rgba(24,151,160,0.42);
  border-radius: 999px;
  padding: 4px 8px;
  color: #1897a0;
  background: rgba(255,255,255,0.72);
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}

.encounter-card p {
  margin: 8px 0 0;
  color: #55677d;
  font-size: 0.88rem;
  line-height: 1.55;
}

.encounter-card .muted-note {
  color: #91a0b3;
  font-style: italic;
}

.timeline-day-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 14px;
  border-bottom: 1px solid #eadfca;
}

.timeline-day-tabs button {
  border: none;
  background: transparent;
  color: #2f4858;
  font-size: 0.82rem;
  font-weight: 900;
  position: relative;
  padding-bottom: 8px;
  cursor: pointer;
}

.timeline-day-tabs button.active {
  color: #1897a0;
}

.timeline-day-tabs button::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -11px;
  height: 3px;
  border-radius: 999px;
  background: #1897a0;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.22s ease;
}

.timeline-day-tabs button.active::after {
  transform: scaleX(1);
}

.timeline-log {
  display: grid;
  gap: 0;
}

.timeline-slide-enter-active,
.timeline-slide-leave-active,
.media-swap-enter-active,
.media-swap-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.timeline-slide-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.timeline-slide-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}

.media-swap-enter-from,
.media-swap-leave-to {
  opacity: 0;
  transform: scale(0.985);
}

.timeline-entry {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  padding-bottom: 16px;
}

.timeline-entry.last {
  padding-bottom: 0;
}

.timeline-rail {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
}

.timeline-rail::before {
  content: '';
  position: absolute;
  top: 50%;
  bottom: calc(-50% - 16px);
  border-left: 2px dashed rgba(24,151,160,0.35);
}

.timeline-entry.last .timeline-rail::before {
  display: none;
}

.timeline-dot {
  position: relative;
  z-index: 1;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #1897a0;
  box-shadow: 0 0 0 5px #deefec;
}

.timeline-dot.hollow {
  background: #fffdf8;
  border: 2px solid #1897a0;
}

.timeline-card {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid #eadfca;
  border-radius: 18px;
  background: rgba(255,255,255,0.72);
  box-shadow: 0 10px 24px rgba(47,72,88,0.08);
}

.timeline-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #deefec;
  color: #1897a0;
}

.timeline-card strong,
.timeline-card small {
  display: block;
}

.timeline-card strong {
  color: #2f4858;
  font-weight: 900;
}

.timeline-card small,
.timeline-card time {
  color: #64748b;
  font-size: 0.78rem;
}

.timeline-card time {
  font-weight: 800;
  white-space: nowrap;
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

.traveler-notes-panel {
  margin-top: 22px;
  padding: 18px;
  border: 1px dashed #d8cdbb;
  border-radius: 20px;
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(196,164,132,0.10) 0,
      rgba(196,164,132,0.10) 1px,
      transparent 1px,
      transparent 30px
    ),
    rgba(255,253,248,0.72);
  min-height: 240px;
}

.traveler-notes-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.notes-kicker {
  color: #1897a0;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.traveler-notes-header h3 {
  margin: 2px 0 0;
  color: #2f4858;
  font-size: 1.05rem;
  font-weight: 900;
}

.notes-count {
  border: 1px dashed rgba(24,151,160,0.4);
  border-radius: 999px;
  padding: 5px 9px;
  color: #1897a0;
  background: rgba(255,255,255,0.65);
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}

.comment-list {
  max-height: 190px;
  overflow-y: auto;
  padding-right: 4px;
}

.comment-item {
  background: rgba(255,255,255,0.58);
  border: 1px solid rgba(234,223,202,0.8);
  border-radius: 14px;
  padding: 10px;
}

.comment-avatar {
  background: #dff3ef;
  color: #1897a0;
}

.engagement-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.engagement-icon-btn,
.engagement-count {
  border: none;
  background: transparent;
  color: #1f4e5f;
  padding: 4px 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 900;
}

.engagement-icon-btn i,
.engagement-count i {
  font-size: 1.15rem;
}

.engagement-icon-btn:hover:not(:disabled) {
  color: #1897a0;
}

.engagement-icon-btn.active {
  color: #1897a0;
}

.engagement-icon-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.comment-compose {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.comment-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #deefec;
  color: #1897a0;
  font-weight: 900;
}

.comment-input-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  border: 1px solid #eadfca;
  border-radius: 999px;
  background: #fffdf8;
  overflow: hidden;
}

.comment-input-wrap input {
  width: 100%;
  border: none;
  background: transparent;
  color: #2f4858;
  padding: 9px 12px;
  font-size: 0.85rem;
  outline: none;
}

.comment-input-wrap button {
  border: none;
  background: #1897a0;
  color: #fff;
  align-self: stretch;
  padding: 0 16px;
  font-size: 0.82rem;
  font-weight: 900;
}

.comment-input-wrap button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.comment-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.comment-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.comment-item strong,
.comment-item p {
  display: block;
}

.comment-item strong {
  color: #2f4858;
  font-size: 0.82rem;
}

.comment-item p {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
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

  .detail-top-row {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 576px) {
  .cover-media-cluster {
    grid-template-columns: 1fr;
  }

  .media-side-strip {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    max-height: none;
    padding: 14px 10px;
    scroll-padding-inline: 14px;
  }

  .media-strip-shell {
    background:
      linear-gradient(#eee4be, #eee4be) center / 100% 64px no-repeat;
  }

  .media-scroll-btn {
    display: none;
  }

  .media-thumb :deep(.app-stamp-frame) {
    width: 62px;
  }

  .timeline-card {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .timeline-card time {
    grid-column: 2;
  }

  .encounter-card {
    grid-template-columns: 36px minmax(0, 1fr);
    padding: 12px;
  }

  .encounter-icon {
    width: 36px;
    height: 36px;
    border-radius: 14px;
  }

  .encounter-heading {
    flex-direction: column;
    gap: 6px;
  }

  .encounter-heading span {
    white-space: normal;
  }

}
</style>
