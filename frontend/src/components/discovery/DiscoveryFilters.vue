<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const isFilterOpen = ref(false)
const { t } = useI18n()

function toggleFilterPanel() {
  isFilterOpen.value = !isFilterOpen.value
}

defineProps({
  discoveryMode: {
    type: String,
    required: true
  },
  search: {
    type: String,
    required: true
  },
  selectedContinents: {
    type: Array,
    required: true
  },
  selectedActivities: {
    type: Array,
    required: true
  },
  selectedSpeciesTypes: {
    type: Array,
    required: true
  },
  minDepth: {
    type: Number,
    required: true
  },
  maxDepth: {
    type: Number,
    required: true
  }
})

const emit = defineEmits([
  'update:discoveryMode',
  'update:search',
  'update:selectedContinents',
  'update:selectedActivities',
  'update:selectedSpeciesTypes',
  'update:minDepth',
  'update:maxDepth',
  'reset'
])

const continents = computed(() => [
  { value: 'Asia', label: t('discovery.continentAsia') },
  { value: 'Europe', label: t('discovery.continentEurope') },
  { value: 'Oceania', label: t('discovery.continentOceania') },
  { value: 'North America', label: t('discovery.continentNorthAmerica') },
  { value: 'South America', label: t('discovery.continentSouthAmerica') },
  { value: 'Africa', label: t('discovery.continentAfrica') }
])

const activityOptions = computed(() => [
  { value: 'Snorkeling', label: t('discovery.activitySnorkeling') },
  { value: 'Scuba Diving', label: t('discovery.activityScubaDiving') },
  { value: 'Island Hopping', label: t('discovery.activityIslandHopping') },
  { value: 'Sunset Watching', label: t('discovery.activitySunsetWatching') },
  { value: 'Kayaking', label: t('discovery.activityKayaking') }
])

const speciesTypes = computed(() => [
  { value: 'Fish', label: t('discovery.speciesFish') },
  { value: 'Turtle', label: t('discovery.speciesTurtle') },
  { value: 'Shark', label: t('discovery.speciesShark') },
  { value: 'Ray', label: t('discovery.speciesRay') },
  { value: 'Coral', label: t('discovery.speciesCoral') },
  { value: 'Jellyfish', label: t('discovery.speciesJellyfish') }
])

function toggleArrayValue(array, value, eventName) {
  const updated = array.includes(value)
    ? array.filter(item => item !== value)
    : [...array, value]

  emit(eventName, updated)
}
</script>

<template>
  <aside class="filter-panel">
    <div class="filter-header d-flex justify-content-between align-items-center" @click="toggleFilterPanel">
      <h5 class="fw-bold mb-0 d-flex align-items-center">
        <i class="bi bi-sliders"></i>
        {{ t('discovery.filters') }}
      </h5>

      <i class="bi filter-arrow"
        :class="isFilterOpen ? 'bi-chevron-up' : 'bi-chevron-down'"
      ></i>
    </div>

    <div class="filter-content" :class="{ open: isFilterOpen }">
      <div class="filter-section">
        <label class="form-label fw-semibold">{{ t('discovery.discoveryMode') }}</label>

        <div class="mode-card-group">
          <button
            class="mode-card"
            :class="{ active: discoveryMode === 'islands' }"
            @click="emit('update:discoveryMode', 'islands')"
          >
            <i class="bi bi-geo-alt"></i>
            <span>{{ t('discovery.islandsExplorer') }}</span>
          </button>

          <button
            class="mode-card"
            :class="{ active: discoveryMode === 'marine' }"
            @click="emit('update:discoveryMode', 'marine')"
          >
            <i class="bi bi-water"></i>
            <span>{{ t('discovery.marineEncyclopedia') }}</span>
          </button>
        </div>
      </div>

      <div class="filter-section">
        <label class="form-label fw-semibold">{{ t('discovery.search') }}</label>

        <input
          :value="search"
          @input="emit('update:search', $event.target.value)"
          type="search"
          class="form-control"
          :placeholder="discoveryMode === 'islands'
            ? t('discovery.searchIslands')
            : t('discovery.searchMarine')"
        />
      </div>

      <template v-if="discoveryMode === 'islands'">
        <div class="filter-section">
          <label class="form-label fw-semibold">{{ t('discovery.continents') }}</label>

          <div
            v-for="item in continents"
            :key="item"
            class="form-check"
          >
            <input
              class="form-check-input"
              type="checkbox"
              :checked="selectedContinents.includes(item.value)"
              @change="toggleArrayValue(selectedContinents, item.value, 'update:selectedContinents')"
              :id="`continent-${item.value}`"
            />

            <label class="form-check-label" :for="`continent-${item.value}`">
              {{ item.label }}
            </label>
          </div>
        </div>

        <div class="filter-section">
          <label class="form-label fw-semibold">{{ t('discovery.activities') }}</label>

          <div
            v-for="item in activityOptions"
            :key="item"
            class="form-check"
          >
            <input
              class="form-check-input"
              type="checkbox"
              :checked="selectedActivities.includes(item.value)"
              @change="toggleArrayValue(selectedActivities, item.value, 'update:selectedActivities')"
              :id="`activity-${item.value}`"
            />

            <label class="form-check-label" :for="`activity-${item.value}`">
              {{ item.label }}
            </label>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="filter-section">
          <label class="form-label fw-semibold">{{ t('discovery.speciesType') }}</label>

          <div
            v-for="item in speciesTypes"
            :key="item"
            class="form-check"
          >
            <input
              class="form-check-input"
              type="checkbox"
              :checked="selectedSpeciesTypes.includes(item.value)"
              @change="toggleArrayValue(selectedSpeciesTypes, item.value, 'update:selectedSpeciesTypes')"
              :id="`species-${item.value}`"
            />

            <label class="form-check-label" :for="`species-${item.value}`">
              {{ item.label }}
            </label>
          </div>
        </div>

        <div class="filter-section">
          <div class="depth-label-row">
            <label class="form-label fw-semibold mb-0">{{ t('discovery.depthRange') }}</label>
            <span>{{ minDepth }}-{{ maxDepth }} m</span>
          </div>

          <div class="dual-range-slider position-relative d-flex align-items-center">
            <div class="slider-track position-absolute w-100"></div>

            <div
              class="slider-range"
              :style="{
                left: `${minDepth}%`,
                width: `${maxDepth - minDepth}%`
              }"
            ></div>

            <input
              :value="minDepth"
              type="range"
              min="0"
              max="100"
              step="1"
              class="thumb thumb-left"
              @input="emit(
                'update:minDepth',
                Math.min(Number($event.target.value), maxDepth - 1)
              )"
            />

            <input
              :value="maxDepth"
              type="range"
              min="0"
              max="100"
              step="1"
              class="thumb thumb-right"
              @input="emit(
                'update:maxDepth',
                Math.max(Number($event.target.value), minDepth + 1)
              )"
            />
          </div>
        </div>
      </template>

      <div class="reset-filter-btn">
        <button class="btn btn-outline-primary w-100" @click="emit('reset')">
          {{ t('discovery.resetFilters') }}
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.filter-panel {
  position: sticky;
  top: 25px;
  overflow: visible;
  padding: 22px;
  border-radius: 18px;
  background: #fbf9f1;
  border: 1px dashed #d8cdbb;
  box-shadow: 0 12px 26px rgba(47,72,88,0.08);
}

.filter-panel::before {
  content: '';
  position: absolute;
  top: -13px;
  left: 28px;
  z-index: 2;
  width: 76px;
  height: 20px;
  background: rgba(245,223,154,0.48);
  border-left: 1px dashed rgba(47,72,88,0.12);
  border-right: 1px dashed rgba(47,72,88,0.12);
  box-shadow: 0 5px 12px rgba(47,72,88,0.08);
  transform: rotate(-3deg);
}

.filter-section {
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(216,205,187,0.72);
}

.filter-section:last-of-type {
  border-bottom: none;
}

.mode-card-group {
  display: grid;
  gap: 8px;
}

.mode-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px dashed #d8cdbb;
  border-radius: 14px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.68);
  color: #2f4858;
  font-weight: 800;
  text-align: left;
  transition: 0.2s ease;
}

.mode-card i {
  color: #1897a0;
}

.mode-card:hover {
  transform: translateY(-1px);
  border-color: #1897a0;
  box-shadow: 0 8px 18px rgba(47,72,88,0.08);
}

.mode-card.active {
  background: #1897a0;
  border-color: #1897a0;
  color: #fff;
}

.mode-card.active i {
  color: #fff;
}

.form-control {
  border-color: #d8cdbb;
  border-radius: 12px;
  background: rgba(255,255,255,0.72);
}

.form-check {
  margin-bottom: 6px;
}

.form-check-input {
  border-color: #c4a484;
}

.form-check-input:checked {
  background-color: #1897a0;
  border-color: #1897a0;
}

.depth-label-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.depth-label-row span {
  font-size: 0.82rem;
  color: #64748b;
}

.dual-range-slider {
  height: 34px;
}

.slider-track {
  height: 4px;
  border-radius: 999px;
  background: #d8cdbb;
}

.slider-range {
  position: absolute;
  height: 4px;
  border-radius: 999px;
  background: #1897a0;
}

.thumb {
  position: absolute;
  width: 100%;
  pointer-events: none;
  appearance: none;
  background: none;
}

.thumb::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fbf9f1;
  border: 3px solid #2f4858;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 6px rgba(0,0,0,0.18);
}

.thumb::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fbf9f1;
  border: 3px solid #2f4858;
  cursor: pointer;
  pointer-events: auto;
}

.filter-header {
  gap: 12px;
  cursor: default;
  padding-bottom: 14px;
  margin-bottom: 4px;
  border-bottom: 1px dashed rgba(216,205,187,0.8);
}

.filter-header h5 {
  gap: 8px;
  color: #2f4858;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.filter-arrow {
  display: none;
  color: #1897a0;
}

.filter-content {
  margin-top: 18px;
}

.filter-content::-webkit-scrollbar {
  width: 8px;
}

.filter-content::-webkit-scrollbar-track {
  background: transparent;
}

.filter-content::-webkit-scrollbar-thumb {
  background: #c4a484;
  border-radius: 999px;
}

.filter-content::-webkit-scrollbar-thumb:hover {
  background: #1897a0;
}

@media (max-width: 991px) {
  .filter-header {
    cursor: pointer;
  }

  .filter-arrow {
    display: inline-block;
  }

  .filter-content {
    display: none;
  }

  .filter-content.open {
    display: block;
  }

  .filter-panel {
    position: static;
    overflow: visible;
  }
}

@media (min-width: 992px) {
  .filter-panel {
    max-height: calc(100vh - 50px);
    display: flex;
    flex-direction: column;
  }

  .filter-content {
    display: block !important;
    overflow-y: auto;
    padding-right: 6px;
  }

  .reset-filter-btn {
    position: sticky;
    bottom: 0;
    background:
      linear-gradient(
        180deg,
        rgba(251,249,241,0),
        #fbf9f1 34%
      );
    padding-top: 12px;
  }
}
</style>
