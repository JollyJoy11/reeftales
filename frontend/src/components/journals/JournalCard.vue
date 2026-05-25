<script setup>
import { computed } from 'vue'

const props = defineProps({
  journal: {
    type: Object,
    required: true
  }
})

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
</script>

<template>
  <RouterLink :to="`/journal/${journal.id}`" class="journal-card-link">
    <article class="journal-card h-100">
      <div class="journal-header">
        <img
          v-if="journal.profile_image"
          :src="journal.profile_image"
          class="avatar"
          alt="User avatar"
        />

        <div v-else class="avatar avatar-fallback">
          {{ avatarInitial }}
        </div>

        <div>
          <strong>{{ journal.username }}</strong>
          <span>
            {{ journal.island_name }}, {{ journal.country }} ·
            {{ formatDate(journal.visit_date || journal.created_at) }}
          </span>
        </div>
      </div>

      <div class="postcard-image-wrap">
        <img
          :src="journal.cover_image || '/images/journal-placeholder.jpg'"
          class="journal-cover"
          alt="Journal cover"
        />
      </div>

      <div class="journal-body">
        <div v-if="journal.mood" class="mood-pill">
          {{ journal.mood }}
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
          <span>
            <i class="bi bi-heart"></i>
            {{ journal.like_count || 0 }}
          </span>

          <span>
            <i class="bi bi-chat"></i>
            {{ journal.comment_count || 0 }}
          </span>

          <span>
            <i class="bi bi-bookmark"></i>
            Save
          </span>
        </div>
      </div>
    </article>
  </RouterLink>
</template>

<style scoped>
.journal-card-link {
  text-decoration: none;
}

.journal-card {
  padding: 16px;
  background: #fbf9f1;
  border: 1px solid #eadfca;
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
  transition: transform 0.2s ease;
}

.journal-card:hover {
  transform: translateY(-4px);
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
  padding: 10px 10px 24px;
  background: #fffdf8;
  box-shadow: 0 8px 18px rgba(0,0,0,0.14);
  transform: rotate(-0.8deg);
  margin-bottom: 18px;
}

.journal-cover {
  width: 100%;
  height: 190px;
  object-fit: cover;
  border: 2px solid #475569;
}

.journal-body h4 {
  margin: 8px 0;
  color: #2f4858;
  font-weight: 800;
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
  gap: 16px;
  color: #64748b;
  font-size: 0.82rem;
}

.journal-actions span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

:global(body.dark-mode) .journal-card {
  background: #253244;
  border-color: rgba(255,255,255,0.1);
}

:global(body.dark-mode) .postcard-image-wrap {
  background: #2d3748;
}

:global(body.dark-mode) .journal-header strong,
:global(body.dark-mode) .journal-body h4 {
  color: #f8fafc;
}

:global(body.dark-mode) .journal-header span,
:global(body.dark-mode) .journal-body p,
:global(body.dark-mode) .journal-actions {
  color: #cbd5e1;
}
</style>