<script setup>
import { RouterLink } from 'vue-router'

const props = defineProps({
  species: {
    type: Array,
    default: () => []
  },
  islandName: {
    type: String,
    default: 'this island'
  },
  selectedSpeciesId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['preview'])

function habitatChips(habitats) {
  return String(habitats || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function habitatText(habitats) {
  return habitatChips(habitats).join(' · ')
}

function formatSightingDate(date) {
  if (!date) return 'Recently reported'

  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function speciesImageAlt(item) {
  const scientificName = item.scientificName ? `, ${item.scientificName}` : ''
  return `${item.name || 'Resident species'}${scientificName} reported around ${props.islandName}`
}
</script>

<template>
  <section>
    <div class="section-heading mb-3">
      <h3 class="fw-bold mb-1">Resident Species Found Here</h3>
      <p class="text-muted mb-0">
        Click a species card to preview nearby observation areas around this island.
      </p>
    </div>

    <div class="row g-3">
      <div
        v-for="item in species"
        :key="item.id"
        class="col-12 col-md-4"
      >
        <button
          class="species-mini-card"
          :class="{ active: selectedSpeciesId === item.id }"
          @click="emit('preview', item)"
          :aria-pressed="selectedSpeciesId === item.id"
        >
          <img
            :src="item.image || '/images/species-placeholder.jpg'"
            :alt="speciesImageAlt(item)"
          />

          <div class="species-head">
            <h6>{{ item.name }}</h6>
            <span
              v-if="selectedSpeciesId === item.id"
              class="species-status"
            >
              Selected
            </span>
          </div>

          <small>{{ item.scientificName }}</small>

          <div
            v-if="habitatChips(item.habitats).length"
            class="habitat-inline"
          >
            {{ habitatText(item.habitats) }}
          </div>

          <p v-else>
            {{ item.description || 'Reported by community journals around this island.' }}
          </p>

          <div class="species-card-footer">
            <span>{{ item.sighting_count || 0 }} sightings</span>

            <RouterLink
              :to="`/discovery/species/${item.id}`"
              class="view-species-link"
              @click.stop
            >
              View profile
            </RouterLink>
          </div>

          <span class="species-last-seen">
            {{ formatSightingDate(item.last_seen_at) }}
          </span>
        </button>
      </div>

      <div v-if="!species.length" class="col-12">
        <div class="resident-empty-state">
          <i class="bi bi-binoculars"></i>
          <strong>No resident species reported yet</strong>
          <span>
            Species will appear here after public community diaries add sightings for {{ islandName }}.
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-heading h3 {
  color: var(--text-primary);
}

.species-mini-card {
  width: 100%;
  height: 100%;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-soft);
  padding: 12px;
  text-align: left;
  transition: 0.2s ease;
  display: flex;
  flex-direction: column;
}

.species-mini-card:hover,
.species-mini-card:focus {
  transform: translateY(-3px);
  border-color: var(--accent);
}

.species-mini-card.active {
  border-color: var(--accent);
  box-shadow: 0 16px 32px rgba(38,210,222,0.16);
}

.species-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.species-status {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
}

.species-mini-card img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 14px;
  margin-bottom: 10px;
}

.species-mini-card h6 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 800;
}

.species-mini-card small {
  color: var(--text-secondary);
  font-style: italic;
}

.species-mini-card p {
  margin: 8px 0 0;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.habitat-inline {
  margin-top: 6px;
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.species-card-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  margin-top: auto;
  font-size: 0.72rem;
  font-weight: 900;
}

.species-card-footer span {
  color: var(--text-secondary);
}

.view-species-link {
  color: var(--accent);
  text-decoration: none;
}

.view-species-link:hover,
.view-species-link:focus-visible {
  color: var(--accent-strong);
}

.species-last-seen {
  display: block;
  margin-top: 5px;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 800;
}

.resident-empty-state {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 28px 18px;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background: var(--surface-soft);
  color: var(--text-secondary);
  text-align: center;
}

.resident-empty-state i {
  width: 42px;
  height: 42px;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 1.2rem;
}

.resident-empty-state strong {
  color: var(--text-primary);
}

.resident-empty-state span {
  max-width: 420px;
  font-size: 0.88rem;
}
</style>
