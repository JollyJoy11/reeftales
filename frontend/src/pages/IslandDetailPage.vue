<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import WeatherWidget from '@/components/common/WeatherWidget.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { getIslandById } from '@/services/islandService'
import { getWeather } from '@/services/weatherService'
import L from 'leaflet'

const route = useRoute()
const island = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const selectedSpecies = ref(null)
const weather = ref(null)

const residentSpecies = ref([
  {
    id: 1,
    name: 'Green Sea Turtle',
    scientificName: 'Chelonia mydas',
    image: '/images/species-turtle.jpg',
    notes: 'Often found around shallow reef and seagrass areas.',
    path: [[4.2, 118.6], [4.35, 118.75], [4.48, 118.65]]
  },
  {
    id: 2,
    name: 'Whale Shark',
    scientificName: 'Rhincodon typus',
    image: '/images/species-whaleshark.jpg',
    notes: 'Occasionally seen in deeper open waters.',
    path: [[4.05, 118.3], [4.25, 118.55], [4.55, 118.9]]
  },
  {
    id: 3,
    name: 'Clownfish',
    scientificName: 'Amphiprioninae',
    image: '/images/species-clownfish.jpg',
    notes: 'Commonly found near sea anemones in reef zones.',
    path: [[4.3, 118.5], [4.32, 118.58], [4.36, 118.62]]
  }
])

let map
let markerLayer
let pathLayer

async function loadIsland() {
  try {
    loading.value = true
    errorMessage.value = ''
    island.value = await getIslandById(route.params.id)
  } catch (error) {
    errorMessage.value = 'Failed to load island details.'
  } finally {
    loading.value = false
  }
}

async function loadWeather() {
  if (!island.value?.latitude || !island.value?.longitude) return

  try {
    weather.value = await getWeather(
      island.value.latitude,
      island.value.longitude
    )
  } catch (error) {
    weather.value = null
  }
}

function initMap() {
  if (!island.value) return

  const lat = Number(island.value.latitude) || 4.2
  const lng = Number(island.value.longitude) || 118.6

  map = L.map('islandMap').setView([lat, lng], 9)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  pathLayer = L.layerGroup().addTo(map)

  L.marker([lat, lng])
    .bindPopup(`<strong>${island.value.name}</strong><br>${island.value.country || ''}`)
    .addTo(markerLayer)
}

function showSpeciesPath(species) {
  selectedSpecies.value = species
  pathLayer.clearLayers()

  const polyline = L.polyline(species.path, {
    color: '#1897a0',
    weight: 4
  }).addTo(pathLayer)

  species.path.forEach(point => {
    L.circleMarker(point, {
      radius: 6,
      color: '#1897a0',
      fillColor: '#1897a0',
      fillOpacity: 0.8
    }).addTo(pathLayer)
  })

  map.fitBounds(polyline.getBounds(), { padding: [30, 30] })
}

onMounted(async () => {
  await loadIsland()
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
        <section
          class="island-hero mb-4"
          :style="{
            backgroundImage: `
              linear-gradient(rgba(15,23,42,0.45), rgba(15,23,42,0.62)),
              url(${island.cover_image || '/images/island-placeholder.jpg'})
            `
          }"
        >
          <div class="hero-content">
            <RouterLink to="/discovery" class="back-link hero-back">
              <i class="bi bi-arrow-left"></i>
              Back to Discovery
            </RouterLink>

            <div class="hero-text">
              <span class="hero-region">
                {{ island.continent || 'Island Destination' }}
              </span>

              <h1>{{ island.name }}</h1>

              <p>
                {{ island.location }}, {{ island.country }}
              </p>
            </div>
          </div>
        </section>

        <div class="row g-4">
          <aside class="col-12 col-lg-4">
            <div class="detail-panel">
              <h5 class="section-title">About This Island</h5>

              <p class="island-description">
                {{ island.description }}
              </p>

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

              <WeatherWidget :weather="weather" />

              <div class="activity-section">
                <h6 class="fw-bold">Popular Activities</h6>

                <div class="activity-badges">
                  <span class="badge rounded-pill">Snorkeling</span>
                  <span class="badge rounded-pill">Scuba Diving</span>
                  <span class="badge rounded-pill">Sunset Watching</span>
                </div>
              </div>

              <div class="journal-preview">
                <h6 class="fw-bold">Community Diaries</h6>

                <div class="journal-placeholder">
                  Travel journals for this island will appear here.
                </div>
              </div>
            </div>
          </aside>

          <main class="col-12 col-lg-8">
            <div class="map-card-panel mb-4">
              <div id="islandMap"></div>

              <div v-if="selectedSpecies" class="selected-species-note">
                Showing movement path for
                <strong>{{ selectedSpecies.name }}</strong>
              </div>
            </div>

            <div class="section-heading mb-3">
              <h3 class="fw-bold mb-1">Resident Species Found Here</h3>
              <p class="text-muted mb-0">
                Click a species card to highlight its sample movement path on the map.
              </p>
            </div>

            <div class="row g-3">
              <div
                v-for="species in residentSpecies"
                :key="species.id"
                class="col-12 col-md-4"
              >
                <button
                  class="species-mini-card"
                  @click="showSpeciesPath(species)"
                >
                  <img :src="species.image" alt="Species image" />

                  <h6>{{ species.name }}</h6>

                  <small>{{ species.scientificName }}</small>

                  <p>{{ species.notes }}</p>
                </button>
              </div>
            </div>
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

.island-hero {
  min-height: 340px;
  border-radius: 28px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: end;
  padding: 28px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.18);
}

.hero-content {
  width: 100%;
}

.hero-back {
  color: #ffffff;
  margin-bottom: 24px;
}

.hero-text h1 {
  color: #ffffff;
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 900;
  margin-bottom: 4px;
}

.hero-text p {
  color: rgba(255,255,255,0.9);
  margin-bottom: 16px;
}

.hero-region {
  display: inline-block;
  margin-bottom: 8px;
  color: #dffcff;
  font-size: 0.82rem;
  letter-spacing: 1px;
  text-transform: uppercase;
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

.island-description {
  color: #64748b;
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

.journal-placeholder {
  margin-top: 10px;
  padding: 14px;
  border-radius: 16px;
  border: 1px dashed #c4a484;
  color: #64748b;
  background: #fffdf8;
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

.species-mini-card {
  width: 100%;
  height: 100%;
  border: 1px solid #eadfca;
  border-radius: 18px;
  background: #fbf9f1;
  padding: 12px;
  text-align: left;
  transition: 0.2s ease;
}

.species-mini-card:hover {
  transform: translateY(-3px);
  border-color: #1897a0;
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
  color: #2f4858;
  font-weight: 800;
}

.species-mini-card small {
  color: #64748b;
  font-style: italic;
}

.species-mini-card p {
  margin: 8px 0 0;
  font-size: 0.78rem;
  color: #64748b;
}

@media (max-width: 991px) {
  .detail-panel {
    position: static;
  }

  .island-hero {
    min-height: 280px;
    padding: 22px;
  }
}
</style>