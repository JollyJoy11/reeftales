<script setup>
import { ref, onMounted, watch } from 'vue'
import IslandCard from '@/components/discovery/IslandCard.vue'
import SpeciesCard from '@/components/discovery/SpeciesCard.vue'
import AIIdentifyCard from '@/components/discovery/AIIdentifyCard.vue'
import DiscoveryFilters from '@/components/discovery/DiscoveryFilters.vue'
import DiscoveryMap from '@/components/discovery/DiscoveryMap.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
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
const minDepth = ref(0)
const maxDepth = ref(100)

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
      categories: selectedSpeciesTypes.value,
      minDepth: minDepth.value,
      maxDepth: maxDepth.value
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
  minDepth.value = 0
  maxDepth.value = 100

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
    minDepth,
    maxDepth
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
    <AppAlert
      v-if="errorMessage" :message="errorMessage" variant="danger" @close="errorMessage = ''"
    />

    <section class="container py-3">
      <div class="explore-header mb-4">
        <div>
          <h1 class="fw-bold">Discovery Hub</h1>
          <p class="text-muted mb-0">
            Explore island destinations, marine species, and community sightings.
          </p>
        </div>
      </div>

      <DiscoveryMap
        class="mb-4"
        :discovery-mode="discoveryMode"
        :islands="islands"
        :species-list="speciesList"
      />

      <div class="row g-4">
        <aside class="col-12 col-lg-3">
          <DiscoveryFilters
            v-model:discoveryMode="discoveryMode"
            v-model:search="search"
            v-model:selectedContinents="selectedContinents"
            v-model:selectedActivities="selectedActivities"
            v-model:selectedSpeciesTypes="selectedSpeciesTypes"
            v-model:minDepth="minDepth"
            v-model:maxDepth="maxDepth"
            @reset="resetFilters"
          />
        </aside>

        <main class="col-12 col-lg-9">
          <LoadingState
            v-if="loading"
            :message="`Loading ${discoveryMode === 'islands' ? 'islands' : 'marine species'}...`"
          />

          <div class="row g-4">
            <template v-if="discoveryMode === 'islands'">
              <div
                v-for="(island, index) in islands"
                :key="island.id"
                class="col-12 col-md-6 col-xl-4"
              >
                <IslandCard :island="island" :tilt-variant="index" />
              </div>

              <div v-if="!loading && islands.length === 0" class="col-12 d-flex">
                <EmptyState
                  icon="bi bi-compass"
                  title="No islands found"
                  message="Try changing your search keyword or filters."
                />
              </div>
            </template>

            <template v-else>
              <div class="col-12 col-md-6 col-xl-4 d-flex">
                <AIIdentifyCard class="h-100" />
              </div>

              <div
                v-for="(species, index) in speciesList"
                :key="species.id"
                class="col-12 col-md-6 col-xl-4"
              >
                <SpeciesCard :species="species" :tilt-variant="index + 1" />
              </div>

              <div v-if="!loading && speciesList.length === 0" class="col-12 col-md-6 col-xl-8 d-flex">
                <EmptyState
                  icon="bi bi-water"
                  title="No marine species found"
                  message="Try adjusting the species type, depth range, or search keyword."
                />
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
