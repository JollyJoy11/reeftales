<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import IslandCard from '@/components/discovery/IslandCard.vue'
import SpeciesCard from '@/components/discovery/SpeciesCard.vue'
import AIIdentifyCard from '@/components/discovery/AIIdentifyCard.vue'
import DiscoveryFilters from '@/components/discovery/DiscoveryFilters.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { getIslands } from '@/services/islandService'
import { getSpecies } from '@/services/speciesService'

const islands = ref([])
const speciesList = ref([])
const loading = ref(false)
const errorMessage = ref('')

const discoveryMode = ref('islands')
const viewMode = ref('grid')
const search = ref('')
const selectedContinents = ref([])
const selectedActivities = ref([])
const selectedSpeciesTypes = ref([])
const selectedDepths = ref([])

const continents = ['Asia', 'Europe', 'Oceania', 'North America', 'South America', 'Africa']
const activityOptions = ['Snorkeling', 'Scuba Diving', 'Island Hopping', 'Sunset Watching', 'Kayaking']

async function loadIslands() {
  try {
    loading.value = true
    errorMessage.value = ''

    islands.value = await getIslands({
      search: search.value,
      continents: selectedContinents.value,
      activities: selectedActivities.value
    })
  } catch (error) {
    errorMessage.value = 'Failed to load islands.'
  } finally {
    loading.value = false
  }
}

async function loadSpecies() {
  try {
    loading.value = true
    errorMessage.value = ''

    speciesList.value = await getSpecies({
      search: search.value,
      categories: selectedSpeciesTypes.value
    })
  } catch (error) {
    errorMessage.value = 'Failed to load marine species.'
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  search.value = ''
  selectedContinents.value = []
  selectedActivities.value = []
  selectedSpeciesTypes.value = []
  selectedDepths.value = []

  if (discoveryMode.value === 'islands') {
    loadIslands()
  } else {
    loadSpecies()
  }
}

function handleFilterChange() {
  if (discoveryMode.value === 'islands') {
    loadIslands()
  } else {
    loadSpecies()
  }
}

watch(discoveryMode, (mode) => {
  if (mode === 'islands') {
    loadIslands()
  } else {
    loadSpecies()
  }
})
</script>

<template>
  <MainLayout>
    <section class="container py-5">
      <div class="explore-header mb-4">
        <div>
          <h1 class="fw-bold">Discovery Hub</h1>
          <p class="text-muted mb-0">
            Explore island destinations, marine species, and community sightings.
          </p>
        </div>

        <div class="view-toggle">
          <button
            class="btn"
            :class="viewMode === 'map' ? 'btn-primary' : 'btn-outline-primary'"
            @click="viewMode = 'map'"
          >
            <i class="bi bi-map"></i>
            Map
          </button>

          <button
            class="btn"
            :class="viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'"
            @click="viewMode = 'grid'"
          >
            <i class="bi bi-grid"></i>
            Grid
          </button>
        </div>
      </div>

      <div class="row g-4">
        <!-- Filter Sidebar -->
        <aside class="col-12 col-lg-3">
          <DiscoveryFilters
            v-model:discoveryMode="discoveryMode"
            v-model:viewMode="viewMode"
            v-model:search="search"
            v-model:selectedContinents="selectedContinents"
            v-model:selectedActivities="selectedActivities"
            v-model:selectedSpeciesTypes="selectedSpeciesTypes"
            v-model:selectedDepths="selectedDepths"
            @reset="resetFilters"
          />
        </aside>

        <!-- Content -->
        <main class="col-12 col-lg-9">
          <p v-if="loading">Loading islands...</p>
          <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

          <!-- Map View Placeholder -->
          <div v-if="viewMode === 'map'" class="map-panel">
            <div
              v-for="island in islands"
              :key="island.id"
              class="map-point"
              :style="{
                left: `${20 + island.id * 10}%`,
                top: `${25 + island.id * 8}%`
              }"
            >
              <RouterLink :to="`/islands/${island.id}`" class="map-card">
                <strong>{{ island.name }}</strong>
                <small>{{ island.country }}</small>
              </RouterLink>
            </div>

            <p class="map-note">
              Map view placeholder — later you can replace this with Leaflet or Google Maps.
            </p>
          </div>

          <!-- Grid View -->
          <div v-else class="row g-4">
            <template v-if="discoveryMode === 'islands'">
              <div
                v-for="(island, index) in islands"
                :key="island.id"
                class="col-12 col-md-6 col-xl-4"
              >
                <IslandCard :island="island" :tilt-variant="index" />
              </div>
            </template>

            <template v-else>
              <div class="col-12 col-md-6 col-xl-4">
                <AIIdentifyCard />
              </div>

              <div
                v-for="(species, index) in speciesList"
                :key="species.id"
                class="col-12 col-md-6 col-xl-4"
              >
                <SpeciesCard :species="species" :tilt-variant="index + 1" />
              </div>
            </template>
          </div>
        </main>
      </div>
    </section>
  </MainLayout>
</template>

<style scoped>
.explore-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.map-panel {
  position: relative;
  min-height: 520px;
  border-radius: 24px;
  background:
    linear-gradient(rgba(10,61,98,0.1), rgba(10,61,98,0.2)),
    url('/images/map-placeholder.jpg');
  background-size: cover;
  background-position: center;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.map-point {
  position: absolute;
}

.map-point::before {
  content: "";
  width: 16px;
  height: 16px;
  background: #ff7f50;
  border: 3px solid white;
  border-radius: 50%;
  display: block;
}

.map-card {
  display: none;
  min-width: 160px;
  margin-top: 8px;
  padding: 12px;
  border-radius: 16px;
  background: white;
  color: #1e293b;
  text-decoration: none;
  box-shadow: 0 12px 30px rgba(0,0,0,0.16);
}

.map-point:hover .map-card {
  display: block;
}

.map-card small {
  display: block;
  color: #64748b;
}

.map-note {
  position: absolute;
  left: 20px;
  bottom: 20px;
  background: rgba(255,255,255,0.9);
  padding: 10px 14px;
  border-radius: 12px;
  margin: 0;
  font-size: 0.9rem;
}

.empty-state {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
}

.empty-state i {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.discovery-mode-toggle {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 991px) {
  .explore-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-panel {
    position: static;
  }

  .map-panel {
    min-height: 360px;
  }
}
</style>
