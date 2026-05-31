<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import WeatherWidget from '@/components/common/WeatherWidget.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import AppStampFrame from '@/components/common/AppStampFrame.vue'
import IslandRecentSightings from '@/components/discovery/IslandRecentSightings.vue'
import IslandResidentSpecies from '@/components/discovery/IslandResidentSpecies.vue'
import { getIslandById, getIslandCommunityMedia, getIslandJournals, getIslandRecentSightings, getIslandResidentSpecies, getIslandActivities } from '@/services/islandService'
import { getWeather, getMarineWeather } from '@/services/weatherService'
import L from 'leaflet'
import { useAuthStore } from '@/stores/authStore'
import { useSavedIslandStore } from '@/stores/savedIslandStore'
import { useToastStore } from '@/stores/toastStore'

const authStore = useAuthStore()
const savedIslandStore = useSavedIslandStore()
const toastStore = useToastStore()
const route = useRoute()
const island = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const selectedSpecies = ref(null)
const weather = ref(null)
const marine = ref(null)
const communityMedia = ref([])
const islandJournals = ref([])
const residentSpecies = ref([])
const recentSightings = ref([])
const islandActivities = ref([])

function formatJournalDate(date) {
  if (!date) return 'Recent diary'

  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function journalCover(journal) {
  return journal.cover_image || island.value?.cover_image || '/images/island-placeholder.jpg'
}

function communityMediaAlt(index) {
  const media = communityMedia.value[index]
  const islandName = island.value?.name || 'this island'

  if (media?.caption) return media.caption
  if (media?.species_name) return `${media.species_name} sighting shared from ${islandName}`
  if (media?.activity_name) return `${media.activity_name} memory shared from ${islandName}`

  return `Community memory from ${islandName}`
}

function journalCoverAlt(journal) {
  return `Cover image for ${journal.title || 'community diary'} from ${island.value?.name || journal.island_name || 'this island'}`
}

const isSaved = computed(() => {
  if (!island.value) return false
  return savedIslandStore.isSaved(island.value.id)
})

const diaryPrefillRoute = computed(() => {
  if (!island.value) return '/journal/create'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const prevDate = formatDateForQuery(yesterday)

  return {
    path: '/journal/create',
    query: {
      island_id: island.value.id,
      start_date: prevDate,
      end_date: prevDate,
      title: `${island.value.name} diary`
    }
  }
})

const heroPolaroidImages = computed(() => {
  const unique = []
  const seen = new Set()

  communityMedia.value.forEach((media) => {
    if (!media?.media_url) return
    if (seen.has(media.media_url)) return

    seen.add(media.media_url)

    unique.push({
      src: media.media_url,
      alt: media.caption || media.species_name || media.activity_name || `Community memory from ${island.value?.name || 'this island'}`
    })
  })

  if (island.value?.cover_image && !seen.has(island.value.cover_image)) {
    unique.push({
      src: island.value.cover_image,
      alt: `${island.value.name} island cover`
    })
  }

  return unique.slice(0, 3)
})

function formatDateForQuery(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

async function handleSaveIsland() {
  if (!authStore.isLoggedIn) {
    toastStore.danger('Please login to save islands.')
    return
  }

  try {
    await savedIslandStore.toggle(island.value)
  } catch (error) {
    toastStore.danger('Unable to update saved island.')
  }
}

async function loadIslandCommunityContent() {
  try {
    communityMedia.value = await getIslandCommunityMedia(route.params.id)
    islandJournals.value = await getIslandJournals(route.params.id)
  } catch (error) {
    communityMedia.value = []
    islandJournals.value = []
  }
}

async function loadResidentSpecies() {
  try {
    residentSpecies.value = await getIslandResidentSpecies(route.params.id)
  } catch (error) {
    residentSpecies.value = []
  }
}

async function loadRecentSightings() {
  try {
    recentSightings.value = await getIslandRecentSightings(route.params.id)
  } catch (error) {
    recentSightings.value = []
  }
}

async function loadIslandActivities() {
  try {
    islandActivities.value = await getIslandActivities(route.params.id)
  } catch (error) {
    islandActivities.value = []
  }
}

let map
let markerLayer
let pathLayer

async function loadIsland() {
  try {
    loading.value = true
    errorMessage.value = ''
    island.value = await getIslandById(route.params.id)
    document.title = `${island.value.name} | ReefTales`
  } catch (error) {
    errorMessage.value = 'Failed to load island details.'
  } finally {
    loading.value = false
  }
}

async function loadWeather() {
  if (!island.value?.latitude || !island.value?.longitude) return

  const marineLatitude = island.value.marine_latitude || island.value.latitude
  const marineLongitude = island.value.marine_longitude || island.value.longitude

  const [weatherResult, marineResult] = await Promise.allSettled([
    getWeather(island.value.latitude, island.value.longitude),
    getMarineWeather(marineLatitude, marineLongitude)
  ])

  weather.value =
    weatherResult.status === 'fulfilled'
      ? weatherResult.value
      : null

  marine.value =
    marineResult.status === 'fulfilled'
      ? marineResult.value
      : null
}

function initMap() {
  if (!island.value) return

  const lat = Number(island.value.latitude) || 4.2
  const lng = Number(island.value.longitude) || 118.6

  map = L.map('islandMap', {
    minZoom: 2,
    maxZoom: 8,
    worldCopyJump: false,
    maxBounds: [
      [-85, -180],
      [85, 180]
    ],
    maxBoundsViscosity: 1.0
  }).setView([lat, lng], 9)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  pathLayer = L.layerGroup().addTo(map)

  L.marker([lat, lng])
    .bindPopup(`<strong>${island.value.name}</strong><br>${island.value.country || ''}`)
    .addTo(markerLayer)
}

function getEstimatedObservationPoints(species) {
  const lat = Number(island.value.latitude)
  const lng = Number(island.value.longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return []

  const count = Math.min(Number(species.sighting_count || 1), 5)
  const speciesOffset = Number.isFinite(Number(species.id)) ? Number(species.id) * 0.001 : 0

  const offsets = [
    [0.018, 0.012],
    [-0.014, 0.018],
    [0.012, -0.016],
    [-0.02, -0.008],
    [0.006, 0.026]
  ]

  return offsets.slice(0, count).map(([latOffset, lngOffset]) => [
    lat + latOffset + speciesOffset,
    lng + lngOffset - speciesOffset
  ])
}

function showSpeciesPreview(species) {
  selectedSpecies.value = species
  pathLayer.clearLayers()

  const points = getEstimatedObservationPoints(species)

  points.forEach((point, index) => {
    L.circle(point, {
      radius: 1400 + index * 350,
      color: '#1897a0',
      fillColor: '#1897a0',
      fillOpacity: 0.14,
      weight: 2
    })
      .bindPopup(`
        <strong>${species.name}</strong><br>
        Estimated nearby observation area<br>
        Based on ${species.sighting_count || 0} community sightings
      `)
      .addTo(pathLayer)

    L.circleMarker(point, {
      radius: 5,
      color: '#ffffff',
      fillColor: '#1897a0',
      fillOpacity: 1,
      weight: 2
    }).addTo(pathLayer)
  })

  if (points.length) {
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }
}

onMounted(async () => {
  await loadIsland()
  await loadIslandCommunityContent()
  await loadResidentSpecies()
  await loadRecentSightings()
  await loadIslandActivities()

  if (authStore.isLoggedIn) {
    await savedIslandStore.loadSavedIslands()
  }

  await loadWeather()
  initMap()
})
</script>

<template>
  <MainLayout>
    <section class="container py-4">
      <LoadingState
        v-if="loading"
        message="Loading island details..."
      />

      <p v-if="errorMessage" class="text-danger">
        {{ errorMessage }}
      </p>

      <template v-if="island">
        <section class="island-hero-split mb-4">
          <div class="hero-copy">
            <RouterLink to="/discovery" class="back-link">
              <i class="bi bi-arrow-left"></i>
              Back to Discovery
            </RouterLink>

            <h1>{{ island.name }}</h1>

            <p class="hero-location">
              <i class="bi bi-geo-alt-fill"></i>
              {{ island.location }}, {{ island.country }}
            </p>

            <p class="hero-description">
              {{ island.description }}
            </p>

            <button class="save-detail-btn" @click="handleSaveIsland">
              <i :class="isSaved ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'"></i>
              {{ isSaved ? 'Saved' : 'Save Island' }}
            </button>
          </div>

          <div class="hero-polaroids">
            <div class="hero-polaroid main-photo">
              <img
                :src="heroPolaroidImages[0]?.src || '/images/island-placeholder.jpg'"
                :alt="heroPolaroidImages[0]?.alt || 'Island preview'"
              />
            </div>

            <div
              v-if="heroPolaroidImages[1]"
              class="hero-polaroid small-photo photo-two"
            >
              <img
                :src="heroPolaroidImages[1].src"
                :alt="heroPolaroidImages[1].alt"
              />
            </div>

            <div
              v-if="heroPolaroidImages[2]"
              class="hero-polaroid small-photo photo-three"
            >
              <img
                :src="heroPolaroidImages[2].src"
                :alt="heroPolaroidImages[2].alt"
              />
            </div>

            <span class="floating-shell">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fish-symbol-icon lucide-fish-symbol"><path d="M2 16s9-15 20-4C11 23 2 8 2 8"/></svg>
            </span>
          </div>
        </section>

        <div class="row g-4">
          <aside class="col-12 col-lg-4">
            <div class="detail-panel">
              <h5 class="section-title">About This Island</h5>

              <div class="info-grid">
                <div class="info-card">
                  <span>Best Visit</span>
                  <strong>{{ island.best_visit_time || 'Anytime' }}</strong>
                </div>

                <div class="info-card">
                  <span>Region</span>
                  <strong>{{ island.continent || 'Island destination' }}</strong>
                </div>
              </div>

              <WeatherWidget
                :weather="weather"
                :marine="marine"
              />

              <div class="activity-section">
                <h6 class="fw-bold">Popular Activities</h6>

                <div v-if="islandActivities.length" class="activity-badges">
                  <span
                    v-for="activity in islandActivities"
                    :key="activity.id"
                    class="badge rounded-pill"
                  >
                    <i v-if="activity.icon" :class="activity.icon"></i>
                    {{ activity.name }}
                  </span>
                </div>

                <div v-else class="activity-empty">
                  Activities for this island have not been added yet.
                </div>
              </div>

              <div class="journal-preview">
                <div class="community-diary-heading">
                  <div>
                    <span>Shared stories</span>
                    <h6>Community Diaries</h6>
                  </div>

                  <div class="d-flex gap-3">
                    <RouterLink to="/community" class="view-all-diaries">
                      View all
                    </RouterLink>

                    <RouterLink :to="diaryPrefillRoute" class="write-diary-link">
                      Write diary
                    </RouterLink>
                  </div>
                </div>

                <div v-if="islandJournals.length" class="island-journal-list">
                  <RouterLink
                    v-for="journal in islandJournals"
                    :key="journal.id"
                    :to="`/journal/${journal.id}`"
                    class="island-journal-card"
                  >
                    <AppStampFrame
                      class="island-journal-stamp"
                      :image="journalCover(journal)"
                      :alt="journalCoverAlt(journal)"
                      :contain="false"
                      @error="$event.target.src = '/images/island-placeholder.jpg'"
                    />

                    <div class="island-journal-copy">
                      <small class="journal-date">
                        {{ formatJournalDate(journal.start_date || journal.created_at) }}
                      </small>
                      <strong>{{ journal.title }}</strong>
                      <p>{{ journal.content || 'A reef memory from this island.' }}</p>

                      <div class="journal-mini-footer">
                        <span>
                          <i class="bi bi-person-circle"></i>
                          {{ journal.username }}
                        </span>

                        <span>
                          <i class="bi bi-heart"></i>
                          {{ journal.like_count || 0 }}
                        </span>

                        <span>
                          <i class="bi bi-chat"></i>
                          {{ journal.comment_count || 0 }}
                        </span>
                      </div>
                    </div>
                  </RouterLink>
                </div>

                <div v-else class="journal-placeholder">
                  <i class="bi bi-journal-plus"></i>
                  <strong>No diaries yet</strong>
                  <span>Be the first to share a memory from {{ island.name }}.</span>
                  <RouterLink :to="diaryPrefillRoute">
                    Create diary
                  </RouterLink>
                </div>
              </div>
            </div>
          </aside>

          <main class="col-12 col-lg-8">
            <div class="map-card-panel mb-4">
              <div id="islandMap"></div>

              <div v-if="selectedSpecies" class="selected-species-note">
                Estimated nearby observation areas for
                <strong>{{ selectedSpecies.name }}</strong>
              </div>
            </div>

            <IslandResidentSpecies
              :species="residentSpecies"
              :island-name="island.name"
              @preview="showSpeciesPreview"
            />

            <IslandRecentSightings :sightings="recentSightings" />
          </main>
        </div>
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
  font-weight: 600;
}

.island-hero-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: center;
  padding: 34px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(24,151,160,0.12), transparent 34%),
    #fbf9f1;
  border: 1px solid #eadfca;
  box-shadow: 0 18px 40px rgba(0,0,0,0.10);
  overflow: hidden;
}

.hero-copy h1 {
  color: #2f4858;
  font-size: clamp(2.2rem, 5vw, 4.4rem);
  font-weight: 900;
  margin: 8px 0;
}

.hero-location {
  color: #1f4e5f;
  font-weight: 800;
  margin-bottom: 12px;
}

.hero-description {
  color: #64748b;
  line-height: 1.7;
  max-width: 620px;
}

.hero-polaroids {
  position: relative;
  min-height: 360px;
}

.hero-polaroid {
  position: absolute;
  background: white;
  padding: 12px 12px 32px;
  box-shadow: 0 14px 32px rgba(0,0,0,0.16);
  border: 1px solid rgba(47,72,88,0.1);
}

.hero-polaroid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid rgba(47,72,88,0.16);
}

.main-photo {
  width: 72%;
  height: 260px;
  right: 40px;
  top: 40px;
  transform: rotate(-3deg);
}

.photo-two {
  width: 38%;
  height: 150px;
  left: 20px;
  bottom: 34px;
  transform: rotate(5deg);
}

.photo-three {
  width: 32%;
  height: 130px;
  right: 10px;
  bottom: 18px;
  transform: rotate(-5deg);
}

.floating-shell {
  position: absolute;
  left: 42%;
  top: 8px;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #cdece7;
  color: #1897a0;
  box-shadow: 0 10px 24px rgba(0,0,0,0.12);
  font-size: 1.5rem;
}

.save-detail-btn {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: #1897a0;
  color: white;
  font-weight: 800;
  box-shadow: 0 10px 20px rgba(24,151,160,0.18);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.save-detail-btn:hover,
.save-detail-btn:focus-visible {
  background: #147d84;
  color: #fff;
  transform: translateY(-2px);
  box-shadow:
    0 14px 26px rgba(24,151,160,0.24),
    0 0 0 4px rgba(24,151,160,0.12);
}

.save-detail-btn:active {
  transform: translateY(0);
  box-shadow: 0 8px 16px rgba(24,151,160,0.18);
}

.detail-panel {
  position: sticky;
  top: 24px;
  padding: 20px;
  border-radius: 22px;
  background: #fbf9f1;
  border: 1px solid #eadfca;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.section-title {
  color: #2f4858;
  font-weight: 800;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 18px 0;
}

.info-card {
  padding: 14px;
  border-radius: 16px;
  background: #fffdf8;
  border: 1px solid #eadfca;
}

.info-card span {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
}

.info-card strong {
  color: #2f4858;
}

.activity-section,
.journal-preview {
  margin-top: 20px;
}

.activity-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.activity-badges .badge {
  background: #deefec;
  color: #1897a0;
}

.activity-empty {
  margin-top: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed #d8cdbb;
  background: #fffdf8;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
}

.journal-placeholder {
  display: grid;
  justify-items: start;
  gap: 6px;
  margin-top: 10px;
  padding: 16px;
  border-radius: 18px;
  border: 1px dashed #d8cdbb;
  color: #64748b;
  background:
    linear-gradient(180deg, rgba(255,253,248,0.94), rgba(251,247,239,0.94)),
    repeating-linear-gradient(0deg, transparent 0 26px, rgba(216,205,187,0.28) 27px);
}

.journal-placeholder i {
  width: 38px;
  height: 38px;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
}

.journal-placeholder strong {
  color: #2f4858;
}

.journal-placeholder span {
  font-size: 0.84rem;
}

.journal-placeholder a {
  display: inline-flex;
  align-items: center;
  margin-top: 4px;
  color: #1897a0;
  font-size: 0.82rem;
  font-weight: 900;
  text-decoration: none;
}

.map-card-panel {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid #eadfca;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

#islandMap {
  min-height: 430px;
  width: 100%;
}

.selected-species-note {
  position: absolute;
  left: 16px;
  bottom: 16px;
  background: rgba(255,255,255,0.92);
  padding: 10px 14px;
  border-radius: 14px;
  color: #2f4858;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  z-index: 500;
}

.section-heading h3 {
  color: #2f4858;
}

.island-journal-list {
  display: grid;
  gap: 14px;
  margin-top: 12px;
}

.community-diary-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.community-diary-heading span {
  color: #1897a0;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.community-diary-heading h6 {
  margin: 2px 0 0;
  color: #2f4858;
  font-weight: 900;
}

.view-all-diaries {
  color: #1897a0;
  font-size: 0.78rem;
  font-weight: 900;
  text-decoration: none;
}

.write-diary-link {
  color: #bd704e;
  font-size: 0.78rem;
  font-weight: 900;
  text-decoration: none;
}

.island-journal-card {
  position: relative;
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, #fffdf8 0%, #fbf7ef 100%);
  border: 1px dashed #d8cdbb;
  box-shadow: 0 10px 22px rgba(47,72,88,0.08);
  text-decoration: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.island-journal-card::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 22px;
  width: 64px;
  height: 18px;
  background: rgba(169,216,214,0.48);
  border-left: 1px dashed rgba(47,72,88,0.12);
  border-right: 1px dashed rgba(47,72,88,0.12);
  transform: rotate(4deg);
}

.island-journal-card:hover {
  transform: translateY(-2px);
  border-color: #1897a0;
  box-shadow: 0 14px 26px rgba(47,72,88,0.13);
}

.island-journal-stamp {
  width: 86px;
  aspect-ratio: 0.9;
  transform: rotate(-2deg);
  --stamp-radius: 4px;
  --stamp-size: 13px;
}

.island-journal-copy {
  min-width: 0;
}

.journal-date {
  display: block;
  color: #1897a0;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
}

.island-journal-card strong {
  display: block;
  color: #2f4858;
  font-size: 0.9rem;
  line-height: 1.25;
  margin: 3px 0;
}

.island-journal-card p {
  display: -webkit-box;
  margin: 0;
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.45;
  overflow: hidden;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.journal-mini-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
}

.journal-mini-footer span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 991px) {
  .detail-panel {
    position: static;
  }

  .island-hero-split {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .hero-polaroids {
    min-height: 300px;
  }

  .main-photo {
    width: 76%;
    right: 20px;
  }
}

@media (max-width: 520px) {
  .island-journal-card {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .island-journal-stamp {
    width: 72px;
  }
}

:global(body.dark-mode) .island-journal-card,
:global(body.dark-mode) .journal-placeholder,
:global(body.dark-mode) .resident-empty-state {
  background: #253244;
  border-color: rgba(255,255,255,0.13);
}

:global(body.dark-mode) .community-diary-heading h6,
:global(body.dark-mode) .island-journal-card strong,
:global(body.dark-mode) .journal-placeholder strong,
:global(body.dark-mode) .resident-empty-state strong {
  color: #f8fafc;
}

:global(body.dark-mode) .island-journal-card p,
:global(body.dark-mode) .journal-mini-footer,
:global(body.dark-mode) .journal-placeholder,
:global(body.dark-mode) .journal-placeholder span,
:global(body.dark-mode) .resident-empty-state,
:global(body.dark-mode) .resident-empty-state span {
  color: #cbd5e1;
}
</style>
