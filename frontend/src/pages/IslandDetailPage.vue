<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { getIslandById } from '@/services/islandService'
import WeatherWidget from '@/components/common/WeatherWidget.vue'
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
      <RouterLink to="/discovery" class="back-link">
        <i class="bi bi-arrow-left"></i>
        Back to Discovery
      </RouterLink>

      <p v-if="loading">Loading island...</p>
      <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

      <template v-if="island">
        <div class="island-title-row mb-4">
          <div>
            <h1 class="fw-bold">{{ island.name }}</h1>
            <p class="text-muted mb-0">
              {{ island.location }}, {{ island.country }}
            </p>
          </div>
        </div>

        <div class="row g-4">
          <aside class="col-12 col-lg-4">
            <div class="detail-panel">
              <img
                :src="island.cover_image || '/images/island-placeholder.jpg'"
                class="island-cover"
                alt="Island cover"
              />

              <h5 class="fw-bold mt-3">About this island</h5>
              <p class="text-muted">{{ island.description }}</p>

              <div class="info-box">
                <span>Best Visit Time</span>
                <strong>{{ island.best_visit_time || 'Anytime' }}</strong>
              </div>

              <div class="info-box">
                <span>Region</span>
                <strong>{{ island.continent || 'Island destination' }}</strong>
              </div>

              <WeatherWidget :weather="weather" />
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

            <h3 class="fw-bold mb-3">Resident Species Found Here</h3>

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
  margin-bottom: 18px;
}

.island-title-row h1 {
  color: #2f4858;
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

.island-cover {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 16px;
  border: 6px solid #fffdf8;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.info-box {
  display: grid;
  gap: 2px;
  padding: 12px 0;
  border-top: 1px solid #d8cdbb;
}

.info-box span {
  font-size: 0.78rem;
  color: #64748b;
}

.info-box strong {
  color: #2f4858;
}

.weather-widget {
  margin-top: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 16px;
  background: #fffdf8;
}

.weather-widget i {
  font-size: 1.8rem;
  color: #1897a0;
}

.weather-widget span {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
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
</style>