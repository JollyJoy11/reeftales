<script setup>
import { computed, ref, watch } from 'vue'

import AppStampFrame from '@/components/common/AppStampFrame.vue'
import { toggleJournalLike } from '@/services/journalService'
import { toggleSavedJournal } from '@/services/savedJournalService'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

const props = defineProps({
  journal: {
    type: Object,
    required: true
  }
})

const authStore = useAuthStore()
const toastStore = useToastStore()
const actionLoading = ref(false)
const likeCount = ref(Number(props.journal.like_count || 0))
const commentCount = computed(() => Number(props.journal.comment_count || 0))
const hasLiked = ref(Boolean(props.journal.is_liked || props.journal.liked))
const hasSaved = ref(Boolean(props.journal.is_saved || props.journal.saved))

watch(
  () => props.journal,
  journal => {
    likeCount.value = Number(journal.like_count || 0)
    hasLiked.value = Boolean(journal.is_liked || journal.liked)
    hasSaved.value = Boolean(journal.is_saved || journal.saved)
  }
)

function formatDate(date) {
  if (!date) return 'Recent journey'

  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function splitList(value) {
  if (!value) return []
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

const activityTags = computed(() => splitList(props.journal.activities).slice(0, 2))
const speciesTags = computed(() => splitList(props.journal.species).slice(0, 2))

const avatarInitial = computed(() => {
  return props.journal.username?.charAt(0)?.toUpperCase() || 'U'
})

const coverImage = computed(() => {
  return props.journal.cover_image ||
    props.journal.island_cover_image ||
    '/images/island-placeholder.jpg'
})

const avatarAlt = computed(() => {
  return `${props.journal.username || 'Explorer'} profile photo`
})

const coverAlt = computed(() => {
  const island = props.journal.island_name ? ` at ${props.journal.island_name}` : ''
  return `Cover image for ${props.journal.title || 'journal'}${island}`
})

async function handleLike() {
  if (!authStore.isLoggedIn) {
    toastStore.danger('Please login to like journals.')
    return
  }

  try {
    actionLoading.value = true
    const response = await toggleJournalLike(props.journal.id)
    hasLiked.value = response.liked
    likeCount.value = response.liked
      ? likeCount.value + 1
      : Math.max(0, likeCount.value - 1)
  } catch {
    toastStore.danger('Unable to update like.')
  } finally {
    actionLoading.value = false
  }
}

async function handleSave() {
  if (!authStore.isLoggedIn) {
    toastStore.danger('Please login to save journals.')
    return
  }

  try {
    actionLoading.value = true
    const response = await toggleSavedJournal(props.journal.id)
    hasSaved.value = response.saved
    toastStore.success(response.saved ? 'Journal saved.' : 'Removed from saved journals.')
  } catch {
    toastStore.danger('Unable to update saved journal.')
  } finally {
    actionLoading.value = false
  }
}

function handleCoverError(event) {
  const img = event.target

  if (!img.dataset.fallbackTried && props.journal.island_cover_image) {
    img.dataset.fallbackTried = 'true'
    img.src = props.journal.island_cover_image
    return
  }

  img.src = '/images/island-placeholder.jpg'
}
</script>

<template>
  <RouterLink :to="`/journal/${journal.id}`" class="journal-card-link">
    <article class="journal-card h-100">
      <div class="journal-header">
        <img
          v-if="journal.profile_image"
          :src="journal.profile_image"
          class="avatar"
          :alt="avatarAlt"
        />

        <div v-else class="avatar avatar-fallback">
          {{ avatarInitial }}
        </div>

        <div>
          <strong>{{ journal.username }}</strong>
          <span>
            {{ journal.island_name }}, {{ journal.country }} ·
            {{ formatDate(journal.created_at) }}
          </span>
        </div>
      </div>

      <div class="postcard-image-wrap">
        <AppStampFrame
          class="journal-cover-stamp"
          :image="coverImage"
          :alt="coverAlt"
          :contain="false"
          @error="handleCoverError"
        />
      </div>

      <div class="journal-body">
        <div class="journal-card-meta">
          <div v-if="journal.mood" class="mood-pill">
            {{ journal.mood }}
          </div>
          <span class="island-label">
            <i class="bi bi-geo-alt"></i>
            {{ journal.island_name }}
          </span>
        </div>

        <h4>{{ journal.title }}</h4>

        <p>{{ journal.content }}</p>

        <div class="tag-row">
          <span
            v-for="item in activityTags"
            :key="item"
            class="tag activity-tag"
          >
            {{ item }}
          </span>

          <span
            v-for="item in speciesTags"
            :key="item"
            class="tag species-tag"
          >
            {{ item }}
          </span>
        </div>

        <div class="journal-actions">
          <button
            type="button"
            class="journal-action-btn"
            :class="{ active: hasLiked }"
            :disabled="actionLoading"
            @click.prevent.stop="handleLike"
          >
            <i :class="hasLiked ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
            {{ likeCount }}
          </button>

          <span class="journal-action-static">
            <i class="bi bi-chat"></i>
            {{ commentCount }}
          </span>

          <button
            type="button"
            class="journal-action-btn"
            :class="{ active: hasSaved }"
            :disabled="actionLoading"
            @click.prevent.stop="handleSave"
            title="Save journal"
          >
            <i :class="hasSaved ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'"></i>
          </button>
        </div>
      </div>
    </article>
  </RouterLink>
</template>

<style scoped>
.journal-card-link {
  text-decoration: none;
  display: block;
  height: 100%;
}

.journal-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 14px;
  background:
    linear-gradient(180deg, #fffdf8 0%, #fbf7ef 100%);
  border: 1px dashed #d8cdbb;
  border-radius: 18px;
  box-shadow: 0 14px 30px rgba(47,72,88,0.09);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.journal-card::before {
  content: '';
  position: absolute;
  top: -10px;
  right: 26px;
  z-index: 2;
  width: 84px;
  height: 22px;
  background: rgba(169,216,214,0.44);
  border-left: 1px dashed rgba(47,72,88,0.12);
  border-right: 1px dashed rgba(47,72,88,0.12);
  transform: rotate(4deg);
}

.journal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 34px rgba(47,72,88,0.13);
}

.journal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.journal-header strong,
.journal-header span {
  display: block;
}

.journal-header strong {
  color: #2f4858;
  font-size: 0.92rem;
}

.journal-header span {
  color: #64748b;
  font-size: 0.76rem;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #deefec;
  color: #1897a0;
  font-weight: 800;
}

.postcard-image-wrap {
  position: relative;
  margin: 4px 0 18px;
  transform: rotate(-0.8deg);
}

.journal-cover-stamp {
  width: 100%;
  aspect-ratio: 1.45;
  --stamp-radius: 5px;
  --stamp-size: 16px;
}

.journal-cover-stamp :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-color: rgba(47,72,88,0.22);
}

.journal-body {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.journal-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.journal-body h4 {
  margin: 8px 0;
  color: #2f4858;
  font-weight: 900;
  line-height: 1.2;
}

.journal-body p {
  color: #64748b;
  font-size: 0.9rem;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mood-pill {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 999px;
  background: #deefec;
  color: #1897a0;
  font-size: 0.72rem;
  font-weight: 700;
}

.island-label {
  min-width: 0;
  color: #7c6f63;
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

.tag {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.activity-tag {
  background: #fff3cd;
  color: #8a5a00;
}

.species-tag {
  background: #deefec;
  color: #1897a0;
}

.journal-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px dashed #eadfca;
  color: #64748b;
  font-size: 0.82rem;
}

.journal-action-btn,
.journal-action-static {
  border: none;
  background: transparent;
  color: inherit;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font: inherit;
  font-weight: 800;
}

.journal-action-btn {
  cursor: pointer;
}

.journal-action-btn:hover:not(:disabled),
.journal-action-btn.active {
  color: #1897a0;
}

.journal-action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
