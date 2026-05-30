<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  sightings: {
    type: Array,
    default: () => []
  }
})

function relativeDate(date) {
  if (!date) return 'Recently'

  const diffMs = Date.now() - new Date(date).getTime()
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks === 1) return '1 week ago'
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`

  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function sightingImageAlt(sighting) {
  const scientificName = sighting.scientificName ? `, ${sighting.scientificName}` : ''
  return `${sighting.name || 'Species'}${scientificName} sighting reported by ${sighting.username || 'a community member'}`
}
</script>

<template>
  <section class="recent-sightings-panel">
    <div class="section-heading mb-3">
      <h3 class="fw-bold mb-1">Recent Community Sightings</h3>
      <p class="text-muted mb-0">
        Latest species reported by public reef diaries.
      </p>
    </div>

    <div v-if="sightings.length" class="sighting-list">
      <RouterLink
        v-for="sighting in sightings"
        :key="`${sighting.journal_id}-${sighting.species_id}-${sighting.created_at}`"
        :to="`/journal/${sighting.journal_id}`"
        class="sighting-card"
      >
        <img
          :src="sighting.image_url || '/images/species-placeholder.jpg'"
          :alt="sightingImageAlt(sighting)"
        />

        <div>
          <strong>{{ sighting.name }}</strong>
          <span>
            Seen {{ relativeDate(sighting.created_at) }} by {{ sighting.username }}
          </span>
          <small v-if="sighting.quantity">
            {{ sighting.quantity }} reported
          </small>
        </div>
      </RouterLink>
    </div>

    <div v-else class="sighting-empty">
      <i class="bi bi-eye"></i>
      <span>No recent sightings yet.</span>
    </div>
  </section>
</template>

<style scoped>
.recent-sightings-panel {
  margin-top: 28px;
}

.section-heading h3 {
  color: #2f4858;
}

.sighting-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sighting-card {
  display: grid;
  height: 100%;
  min-height: 92px;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid #eadfca;
  background: #fffdf8;
  text-decoration: none;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.sighting-card:hover {
  transform: translateY(-2px);
  border-color: #1897a0;
  box-shadow: 0 12px 24px rgba(47,72,88,0.1);
}

.sighting-card img {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  object-fit: cover;
  background: #deefec;
}

.sighting-card strong {
  display: block;
  color: #2f4858;
  font-weight: 900;
}

.sighting-card span,
.sighting-card small {
  display: block;
  color: #64748b;
  font-size: 0.82rem;
}

.sighting-card small {
  margin-top: 2px;
  color: #1897a0;
  font-weight: 900;
}

.sighting-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  border: 1px dashed #d8cdbb;
  background: #fbf9f1;
  color: #64748b;
  font-weight: 800;
}

.sighting-empty i {
  color: #1897a0;
}

:global(body.dark-mode) .sighting-card,
:global(body.dark-mode) .sighting-empty {
  background: #253244;
  border-color: rgba(255,255,255,0.13);
}

:global(body.dark-mode) .sighting-card strong {
  color: #f8fafc;
}

:global(body.dark-mode) .sighting-card span,
:global(body.dark-mode) .sighting-empty {
  color: #cbd5e1;
}

@media (max-width: 768px) {
  .sighting-list {
    grid-template-columns: 1fr;
  }
}
</style>
