<script setup>
import { ref, onMounted, watch } from 'vue'
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
const search = ref('')
const selectedContinents = ref([])
const selectedActivities = ref([])
const selectedSpeciesTypes = ref([])
const selectedDepths = ref([])

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

watch(
  [
    search,
    selectedContinents,
    selectedActivities,
    selectedSpeciesTypes,
    selectedDepths
  ],
  () => {
    handleFilterChange()
  },
  { deep: true }
)

onMounted(() => {
  loadIslands()
})
</script>

<template>
  <MainLayout>
    <section class="container py-3">
      <div class="explore-header mb-4">
        <div>
          <h1 class="fw-bold">Discovery Hub</h1>
          <p class="text-muted mb-0">
            Explore island destinations, marine species, and community sightings.
          </p>
        </div>
      </div>

      <div class="map-panel mb-4">
        <div
          v-if="discoveryMode === 'islands'"
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

        <div
          v-else
          v-for="species in speciesList"
          :key="species.id"
          class="map-point marine-point"
          :style="{
            left: `${20 + species.id * 12}%`,
            top: `${25 + species.id * 7}%`
          }"
        >
          <div class="map-card">
            <strong>{{ species.name }}</strong>
            <small>{{ species.scientific_name }}</small>
          </div>
        </div>

        <p class="map-note">
          Interactive discovery map - Leaflet integration coming later.
        </p>
      </div>

      <div class="row g-4">
        <aside class="col-12 col-lg-3">
          <DiscoveryFilters
            v-model:discoveryMode="discoveryMode"
            v-model:search="search"
            v-model:selectedContinents="selectedContinents"
            v-model:selectedActivities="selectedActivities"
            v-model:selectedSpeciesTypes="selectedSpeciesTypes"
            v-model:selectedDepths="selectedDepths"
            @reset="resetFilters"
          />
        </aside>

        <main class="col-12 col-lg-9">
          <p v-if="loading">Loading {{ discoveryMode === 'islands' ? 'islands' : 'marine species' }}...</p>
          <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

          <div class="row g-4">
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

.map-panel {
  position: relative;
  min-height: 420px;
  border: 1px solid #eadfca;
  border-radius: 22px;
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
  margin: 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(255,255,255,0.9);
  font-size: 0.9rem;
}

@media (max-width: 991px) {
  .explore-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .map-panel {
    min-height: 320px;
  }
}

</style>
