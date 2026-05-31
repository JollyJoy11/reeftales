<script setup>
import { computed, onMounted, ref, nextTick, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { getSpeciesById, getSpeciesOccurrences } from '@/services/speciesService'
import SpeciesViewingGuide from '@/components/discovery/SpeciesViewingGuide.vue'
import SpeciesTravelerGallery from '@/components/discovery/SpeciesTravelerGallery.vue'
import L from 'leaflet'

const route = useRoute()

const species = ref(null)
const occurrenceData = ref(null)
const loading = ref(false)
const occurrenceLoading = ref(false)
const errorMessage = ref('')
const activeGalleryIndex = ref(0)
const selectedMonthIndex = ref(-1)

let map = null
let occurrenceLayer = null

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const travelerMedia = computed(() => species.value?.media || [])

const activeGalleryItem = computed(() => {
  return travelerMedia.value[activeGalleryIndex.value] || null
})

const selectedMonth = computed(() => {
  if (selectedMonthIndex.value === -1) return null
  return seasonalChart.value[selectedMonthIndex.value]
})

const selectedMonthLabel = computed(() => {
  return selectedMonthIndex.value === -1
    ? 'All months'
    : monthLabels[selectedMonthIndex.value]
})

const selectedMonthRecordCount = computed(() => {
  if (selectedMonthIndex.value === -1) {
    return occurrenceData.value?.occurrences?.length || 0
  }

  return filteredMonthOccurrences.value.length
})

const peakMonths = computed(() => {
  const max = maxSeasonalCount.value

  return seasonalChart.value
    .filter(month => month.count > 0 && month.count === max)
    .map(month => month.label)
})

const filteredMonthOccurrences = computed(() => {
  return (occurrenceData.value?.occurrences || []).filter(item => {
    if (!item.event_date) return false

    const date = new Date(item.event_date)
    if (Number.isNaN(date.getTime())) return false

    return date.getMonth() === selectedMonthIndex.value
  })
})

const viewingGuide = computed(() => {
  const minDepth = Number(species.value?.min_depth ?? 0)
  const maxDepth = Number(species.value?.max_depth ?? 0)

  let activity = 'Guided snorkeling or diving'
  let difficulty = 'Moderate'

  if (maxDepth <= 5) {
    activity = 'Shallow snorkeling'
    difficulty = 'Beginner friendly'
  } else if (minDepth <= 10 && maxDepth <= 40) {
    activity = 'Snorkeling or scuba diving'
    difficulty = 'Moderate'
  } else if (minDepth > 40) {
    activity = 'Advanced scuba diving'
    difficulty = 'Experienced divers only'
  }

  return {
    activity,
    difficulty,
    depthText: `${species.value?.min_depth ?? 0}m - ${species.value?.max_depth ?? '-'}m`,
    habitat: species.value?.habitats || 'reef or coastal habitats',
    conservationNote: species.value?.conservation_status &&
      !['least concern', 'unknown'].includes(species.value.conservation_status.toLowerCase())
        ? 'Observe from a distance and avoid touching or chasing this species.'
        : 'Observe calmly and avoid disturbing its natural behaviour.'
  }
})

const topCountries = computed(() => {
  const counts = {}

  ;(occurrenceData.value?.occurrences || []).forEach(item => {
    if (!item.country) return

    counts[item.country] =
      (counts[item.country] || 0) + 1
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
})

const visibleMapOccurrences = computed(() => {
  if (selectedMonthIndex.value === -1) {
    return occurrenceData.value?.occurrences || []
  }

  return filteredMonthOccurrences.value
})

const visibleMapSummary = computed(() => {
  const records = visibleMapOccurrences.value
  const countries = new Set()
  let obis = 0
  let gbif = 0
  let latestYear = null

  records.forEach(item => {
    if (item.source === 'OBIS') obis++
    if (item.source === 'GBIF') gbif++
    if (item.country) countries.add(item.country)

    if (item.event_date) {
      const date = new Date(item.event_date)
      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear()
        latestYear = latestYear ? Math.max(latestYear, year) : year
      }
    }
  })

  return {
    total: records.length,
    obis,
    gbif,
    countries: countries.size,
    latestYear
  }
})

const peakObservationSummary = computed(() => {
  const sorted = [...seasonalChart.value]
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)

  if (!sorted.length) {
    return {
      months: 'Not enough data',
      count: 0
    }
  }

  const topCount = sorted[0].count
  const months = sorted
    .filter(item => item.count === topCount)
    .map(item => item.label)

  return {
    months: months.join(', '),
    count: topCount
  }
})

const seasonalChart = computed(() => {
  const rows = occurrenceData.value?.seasonal_summary || []

  return monthLabels.map((label, index) => {
    const match = rows.find(row => Number(row.month) === index + 1)

    return {
      label,
      count: Number(match?.count || 0)
    }
  })
})

const maxSeasonalCount = computed(() => {
  return Math.max(...seasonalChart.value.map(item => item.count), 1)
})

const uniqueCountries = computed(() => {
  const countries = new Set()

  ;(occurrenceData.value?.occurrences || []).forEach(item => {
    if (item.country) countries.add(item.country)
  })

  return Array.from(countries)
})

function speciesImageAlt() {
  if (!species.value) return 'Marine species'

  return `${species.value.name}${species.value.scientific_name ? `, ${species.value.scientific_name}` : ''}`
}

function selectGallery(index) {
  activeGalleryIndex.value = index
}

function stepGallery(direction) {
  if (!travelerMedia.value.length) return

  activeGalleryIndex.value =
    (activeGalleryIndex.value + direction + travelerMedia.value.length) %
    travelerMedia.value.length
}

function selectMonth(index) {
  selectedMonthIndex.value = index
}

async function loadSpecies() {
  try {
    loading.value = true
    errorMessage.value = ''

    species.value = await getSpeciesById(route.params.id)

    document.title = `${species.value.name} | Reef Tales`
  } catch (error) {
    errorMessage.value = 'Failed to load species details.'
  } finally {
    loading.value = false
  }
}

async function loadOccurrences() {
  try {
    occurrenceLoading.value = true
    occurrenceData.value = await getSpeciesOccurrences(route.params.id)
  } catch (error) {
    occurrenceData.value = {
      obis_count: 0,
      gbif_count: 0,
      total_count: 0,
      occurrences: [],
      seasonal_summary: []
    }
  } finally {
    occurrenceLoading.value = false
  }
}

function initMap() {
  const mapElement = document.getElementById('speciesDistributionMap')
  if (!mapElement || map) return

  map = L.map(mapElement, {
    minZoom: 2,
    maxZoom: 8,
    worldCopyJump: false,
    maxBounds: [
      [-85, -180],
      [85, 180]
    ],
    maxBoundsViscosity: 1.0
  }).setView([0, 120], 2)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

  occurrenceLayer = L.layerGroup().addTo(map)

  renderOccurrences()
}

function renderOccurrences() {
  if (!map || !occurrenceLayer) return

  occurrenceLayer.clearLayers()

  const occurrences = visibleMapOccurrences.value
  const bounds = []

  occurrences.forEach(item => {
    const lat = Number(item.latitude)
    const lng = Number(item.longitude)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    bounds.push([lat, lng])

    const color = item.source === 'OBIS' ? '#1897a0' : '#c9912e'

    L.circleMarker([lat, lng], {
      radius: 5,
      color,
      fillColor: color,
      fillOpacity: 0.68,
      weight: 1
    })
      .bindPopup(`
        <strong>${species.value?.name || 'Species occurrence'}</strong><br>
        Source: ${item.source}<br>
        ${item.country ? `Country: ${item.country}<br>` : ''}
        ${item.event_date ? `Date: ${item.event_date}` : ''}
      `)
      .addTo(occurrenceLayer)
  })

  if (bounds.length) {
    map.fitBounds(bounds, {
      padding: [34, 34],
      maxZoom: 5
    })
  }
}

watch(selectedMonthIndex, () => {
  renderOccurrences()
})

function formatCount(value) {
  return Number(value || 0).toLocaleString()
}

onMounted(async () => {
  await loadSpecies()
  await loadOccurrences()
  await nextTick()
  initMap()
})
</script>

<template>
  <MainLayout>
    <section class="container py-4">
      <LoadingState
        v-if="loading"
        message="Loading species profile..."
      />

      <p v-if="errorMessage" class="text-danger">
        {{ errorMessage }}
      </p>

      <template v-if="species">
        <section class="species-hero">
          <div class="species-profile-photo">
            <img
              :src="species.image_url || '/images/species-placeholder.jpg'"
              :alt="speciesImageAlt()"
            />
          </div>

          <div class="species-copy">
            <RouterLink to="/discovery" class="back-link">
              <i class="bi bi-arrow-left"></i>
              Back to Discovery
            </RouterLink>

            <h1>{{ species.name }}</h1>

            <p class="scientific-name">
              {{ species.scientific_name }}
            </p>

            <p class="species-description">
              {{ species.description }}
            </p>

            <div class="species-facts">
              <span>
                Conservation
                <strong>{{ species.conservation_status || 'Unknown' }}</strong>
              </span>

              <span>
                Depth Range
                <strong>{{ species.min_depth || 0 }}m - {{ species.max_depth || '-' }}m</strong>
              </span>

              <span>
                Habitat
                <strong>{{ species.habitats || 'Not specified' }}</strong>
              </span>
            </div>

            <div class="species-local-summary">
              <div>
                <strong>{{ species.local_summary?.local_sighting_count || 0 }}</strong>
                <span>Traveler Sightings</span>
              </div>

              <div>
                <strong>{{ species.local_summary?.local_island_count || 0 }}</strong>
                <span>Locations Recorded</span>
              </div>

              <div>
                <strong>{{ species.local_summary?.local_media_count || 0 }}</strong>
                <span>Photos Shared</span>
              </div>
            </div>
          </div>
        </section>

        <section class="species-section">
          <div class="section-heading">
            <span>Where You Might Find Them</span>
            <h3>Known Habitat Range</h3>
            <p>
              This map shows places where this species has been recorded around the world.
            </p>
          </div>

          <div class="map-shell">
            <div class="map-stat-strip">
              <div>
                <strong>{{ formatCount(visibleMapSummary.total) }}</strong>
                <span>{{ selectedMonthLabel }} records</span>
              </div>

              <div>
                <strong>{{ visibleMapSummary.countries }}</strong>
                <span>Countries</span>
              </div>

              <div>
                <strong>{{ formatCount(visibleMapSummary.obis + visibleMapSummary.gbif) }}</strong>
                <span>Mapped points</span>
              </div>

              <div>
                <strong>{{ visibleMapSummary.latestYear || '—' }}</strong>
                <span>Latest year</span>
              </div>
            </div>

            <div v-if="topCountries.length" class="map-country-strip">
              <span
                v-for="[country, count] in topCountries"
                :key="country"
              >
                {{ country }}
              </span>
            </div>

            <div id="speciesDistributionMap" class="species-map"></div>

            <div class="map-legend">
              <span><i class="obis-dot"></i> OBIS</span>
              <span><i class="gbif-dot"></i> GBIF</span>
            </div>
          </div>
        </section>

        <section class="species-section">
          <div class="row g-4">
            <div class="col-12 col-lg-7">
              <div class="seasonality-panel h-100">
                <div class="section-heading">
                  <span>Seasonality</span>
                  <h3>Seasonal Observation Pattern</h3>
                  <p>
                    Slide through the months to filter the map and see where records appear.
                  </p>
                </div>

                <div class="selected-month-card">
                  <span>{{ selectedMonthLabel }}</span>

                  <strong>
                    {{ selectedMonthRecordCount }} observations
                  </strong>

                  <small>
                    Map is showing records for this selected month.
                  </small>
                </div>

                <div class="peak-summary-card">
                  <span>Peak observation period</span>
                  <strong>{{ peakObservationSummary.months }}</strong>
                  <small>{{ peakObservationSummary.count }} records in the highest month.</small>
                </div>

                <input
                  v-model.number="selectedMonthIndex"
                  type="range"
                  min="-1"
                  max="11"
                  step="1"
                  class="month-slider"
                />

                <div class="season-chart">
                  <button
                    v-for="(month, index) in seasonalChart"
                    :key="month.label"
                    type="button"
                    class="season-bar-item"
                    :class="{ active: index === selectedMonthIndex }"
                    @click="selectMonth(index)"
                  >
                    <div class="season-bar-track">
                      <div
                        class="season-bar-fill"
                        :style="{ height: `${(month.count / maxSeasonalCount) * 100}%` }"
                      ></div>
                    </div>

                    <span>{{ month.label }}</span>
                    <small>{{ month.count }}</small>
                  </button>
                </div>
              </div>
            </div>

            <div class="col-12 col-lg-5">
              <SpeciesViewingGuide
                :guide="viewingGuide"
                :occurrence-data="occurrenceData"
                :unique-countries="uniqueCountries"
                :format-count="formatCount"
              />
            </div>
          </div>
        </section>

        <SpeciesTravelerGallery
          :media="travelerMedia"
          :species-name="species.name"
        />
      </template>
    </section>
  </MainLayout>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #1897a0;
  text-decoration: none;
  font-weight: 800;
  margin-bottom: 14px;
}

.species-hero {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 30px;
  padding: 30px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(24,151,160,0.12), transparent 34%),
    #fbf9f1;
  border: 1px solid #eadfca;
  box-shadow: 0 16px 38px rgba(0,0,0,0.1);
}

.species-profile-photo {
  background: #fffdf8;
  padding: 14px 14px 34px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.14);
  transform: rotate(-2deg);
}

.species-profile-photo img {
  width: 100%;
  height: 260px;
  object-fit: cover;
  border: 1px solid rgba(47,72,88,0.16);
}

.species-copy h1 {
  color: #2f4858;
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 900;
  margin: 8px 0;
}

.scientific-name {
  color: #64748b;
  font-style: italic;
  font-weight: 700;
}

.species-description {
  color: #64748b;
  line-height: 1.7;
}

.species-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.species-facts span {
  display: grid;
  gap: 2px;
  padding: 9px 13px;
  border-radius: 16px;
  background: #fffdf8;
  border: 1px dashed #eadfca;
  color: #64748b;
  font-size: 0.78rem;
}

.species-facts strong {
  color: #2f4858;
}

.species-local-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px;
  margin-top: 18px;
}

.species-local-summary div {
  padding: 14px;
  border-radius: 18px;
  background: #fffdf8;
  border: 1px solid #eadfca;
}

.species-local-summary strong {
  display: block;
  color: #1897a0;
  font-size: 1.25rem;
  font-weight: 900;
}

.species-local-summary span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
}

.species-section {
  margin-top: 28px;
}

.section-heading span {
  color: #1897a0;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.section-heading h3 {
  color: #2f4858;
  font-weight: 900;
  margin: 2px 0 4px;
}

.section-heading p {
  color: #64748b;
  margin-bottom: 14px;
}

.seasonality-panel {
  position: relative;
  padding: 18px;
  border-radius: 24px;
  background: #fbf9f1;
  border: 1px dashed #eadfca;
}

.gallery-main {
  border-radius: 18px;
  background: #102f3a;
  overflow: hidden;
}

.gallery-main img,
.gallery-main video {
  width: 100%;
  max-height: 420px;
  object-fit: contain;
  background: #102f3a;
  display: block;
}

.gallery-nav {
  position: absolute;
  top: 45%;
  z-index: 3;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: #1897a0;
  color: white;
  display: grid;
  place-items: center;
}

.gallery-nav.previous {
  left: 28px;
}

.gallery-nav.next {
  right: 28px;
}

.gallery-caption {
  display: grid;
  gap: 2px;
  margin-top: 12px;
}

.gallery-caption strong {
  color: #2f4858;
}

.gallery-caption span {
  color: #64748b;
  font-size: 0.82rem;
}

.gallery-thumbs {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
}

.gallery-thumbs button {
  flex: 0 0 70px;
  width: 70px;
  aspect-ratio: 1;
  border: 1px dashed #d8cdbb;
  border-radius: 14px;
  padding: 4px;
  background: #fffdf8;
  opacity: 0.65;
}

.gallery-thumbs button.active,
.gallery-thumbs button:hover {
  opacity: 1;
  border-color: #1897a0;
}

.gallery-thumbs img,
.video-thumb video {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}

.video-thumb {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}

.video-thumb i {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: white;
  background: rgba(16,47,58,0.35);
  border-radius: 10px;
}

.map-stat-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.map-stat-strip div {
  padding: 12px;
  border-radius: 16px;
  background: #fffdf8;
  border: 1px dashed #eadfca;
}

.map-stat-strip strong {
  display: block;
  color: #1897a0;
  font-size: 1.1rem;
  font-weight: 900;
}

.map-stat-strip span {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 800;
}

.map-shell {
  position: relative;
}

.species-map {
  min-height: 470px;
  border-radius: 22px;
  border: 1px solid #eadfca;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.map-legend {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 500;
  display: flex;
  gap: 10px;
  padding: 8px 11px;
  border-radius: 999px;
  background: rgba(255,255,255,0.92);
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
}

.map-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.map-legend i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.obis-dot {
  background: #1897a0;
}

.gbif-dot {
  background: #c9912e;
}

.selected-month-card {
  display: grid;
  gap: 3px;
  margin-bottom: 14px;
  padding: 14px;
  border-radius: 18px;
  background: #fffdf8;
  border: 1px dashed #eadfca;
}

.selected-month-card span {
  color: #1897a0;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

.selected-month-card strong {
  color: #2f4858;
  font-size: 1.25rem;
}

.selected-month-card small {
  color: #64748b;
  font-weight: 700;
}

.month-slider {
  width: 100%;
  accent-color: #1897a0;
  margin-bottom: 12px;
}

.month-slider {
  width: 100%;
  height: 34px;
  margin: 4px 0 0;
  appearance: none;
  background: transparent;
}

.month-slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: #d8cdbb;
}

.month-slider::-webkit-slider-thumb {
  appearance: none;
  width: 21px;
  height: 21px;
  margin-top: -7.5px;
  border-radius: 50%;
  background: #fbf9f1;
  border: 4px solid #1897a0;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(47,72,88,0.2);
  transition: 0.16s ease;
}

.month-slider::-webkit-slider-thumb:hover {
  transform: scale(1.12);
  border-color: #2f4858;
}

.month-slider::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: #d8cdbb;
}

.month-slider::-moz-range-thumb {
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: #fbf9f1;
  border: 4px solid #1897a0;
  cursor: pointer;
}

.season-bar-item {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.season-bar-item.active .season-bar-track {
  box-shadow: 0 0 0 3px rgba(24,151,160,0.18);
}

.season-bar-item.active span {
  color: #1897a0;
}

.month-note {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
}

.season-chart {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 8px;
}

.season-bar-item {
  display: grid;
  justify-items: center;
  gap: 6px;
}

.season-bar-track {
  width: 18px;
  height: 130px;
  border-radius: 999px;
  background: #deefec;
  display: flex;
  align-items: end;
  overflow: hidden;
}

.season-bar-fill {
  width: 100%;
  min-height: 4px;
  border-radius: 999px;
  background: #1897a0;
}

.season-bar-item span,
.season-bar-item small {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
}

.global-presence {
  margin-top: 18px;
}

.global-presence h5 {
  color: #2f4858;
  font-weight: 900;
  margin-bottom: 8px;
}

.global-presence p {
  color: #64748b;
  font-size: 0.85rem;
}

.peak-summary-card {
  display: grid;
  gap: 3px;
  margin-bottom: 14px;
  padding: 14px;
  border-radius: 18px;
  background: #deefec;
  border: 1px solid rgba(24,151,160,0.18);
}

.peak-summary-card span {
  color: #1897a0;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.peak-summary-card strong {
  color: #2f4858;
  font-size: 1.1rem;
}

.peak-summary-card small {
  color: #64748b;
  font-weight: 700;
}

.map-country-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 14px;
}

.map-country-strip span {
  padding: 7px 12px;
  border-radius: 999px;
  background: #deefec;
  color: #1897a0;
  font-size: 0.76rem;
  font-weight: 900;
}

@media (max-width: 991px) {
  .species-hero {
    grid-template-columns: 1fr;
  }

  .species-local-summary {
    grid-template-columns: 1fr;
  }

  .season-chart {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: 576px) {
  .species-hero {
    padding: 20px;
  }

  .species-facts {
    display: grid;
  }
}
</style>