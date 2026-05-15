<script setup>
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

const continents = ['Asia', 'Europe', 'Oceania', 'North America', 'South America', 'Africa']

const activityOptions = [
  'Snorkeling',
  'Scuba Diving',
  'Island Hopping',
  'Sunset Watching',
  'Kayaking'
]

const speciesTypes = [
  'Fish',
  'Turtle',
  'Shark',
  'Ray',
  'Coral',
  'Jellyfish'
]

function toggleArrayValue(array, value, eventName) {
  const updated = array.includes(value)
    ? array.filter(item => item !== value)
    : [...array, value]

  emit(eventName, updated)
}
</script>

<template>
  <aside class="filter-panel">
    <h5 class="fw-bold mb-3">Filters</h5>

    <div class="filter-section">
      <label class="form-label fw-semibold">Discovery Mode</label>

      <div class="mode-card-group">
        <button
          class="mode-card"
          :class="{ active: discoveryMode === 'islands' }"
          @click="emit('update:discoveryMode', 'islands')"
        >
          <i class="bi bi-geo-alt"></i>
          <span>Islands Explorer</span>
        </button>

        <button
          class="mode-card"
          :class="{ active: discoveryMode === 'marine' }"
          @click="emit('update:discoveryMode', 'marine')"
        >
          <i class="bi bi-water"></i>
          <span>Marine Encyclopedia</span>
        </button>
      </div>
    </div>

    <div class="filter-section">
      <label class="form-label fw-semibold">Search</label>

      <input
        :value="search"
        @input="emit('update:search', $event.target.value)"
        type="search"
        class="form-control"
        :placeholder="discoveryMode === 'islands'
          ? 'Search islands...'
          : 'Search marine life...'"
      />
    </div>

    <template v-if="discoveryMode === 'islands'">
      <div class="filter-section">
        <label class="form-label fw-semibold">Continents</label>

        <div
          v-for="item in continents"
          :key="item"
          class="form-check"
        >
          <input
            class="form-check-input"
            type="checkbox"
            :checked="selectedContinents.includes(item)"
            @change="toggleArrayValue(selectedContinents, item, 'update:selectedContinents')"
            :id="`continent-${item}`"
          />

          <label class="form-check-label" :for="`continent-${item}`">
            {{ item }}
          </label>
        </div>
      </div>

      <div class="filter-section">
        <label class="form-label fw-semibold">Activities</label>

        <div
          v-for="item in activityOptions"
          :key="item"
          class="form-check"
        >
          <input
            class="form-check-input"
            type="checkbox"
            :checked="selectedActivities.includes(item)"
            @change="toggleArrayValue(selectedActivities, item, 'update:selectedActivities')"
            :id="`activity-${item}`"
          />

          <label class="form-check-label" :for="`activity-${item}`">
            {{ item }}
          </label>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="filter-section">
        <label class="form-label fw-semibold">Species Type</label>

        <div
          v-for="item in speciesTypes"
          :key="item"
          class="form-check"
        >
          <input
            class="form-check-input"
            type="checkbox"
            :checked="selectedSpeciesTypes.includes(item)"
            @change="toggleArrayValue(selectedSpeciesTypes, item, 'update:selectedSpeciesTypes')"
            :id="`species-${item}`"
          />

          <label class="form-check-label" :for="`species-${item}`">
            {{ item }}
          </label>
        </div>
      </div>

      <div class="filter-section">
        <div class="depth-label-row">
          <label class="form-label fw-semibold mb-0">Depth Range</label>
          <span>{{ minDepth }}-{{ maxDepth }} m</span>
        </div>

        <div class="dual-range-slider">
          <div class="slider-track"></div>

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

    <button class="btn btn-outline-primary w-100 mt-2" @click="emit('reset')">
      Reset Filters
    </button>
  </aside>
</template>

<style scoped>
.filter-panel {
  position: sticky;
  top: 25px;
  padding: 20px;
  border-radius: 22px;
  background: #fbf9f1;
  border: 1px solid #eadfca;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.filter-section {
  margin-bottom: 22px;
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
  border: 1px solid #eadfca;
  border-radius: 16px;
  padding: 12px 14px;
  background: #fffdf8;
  color: #2f4858;
  font-weight: 600;
  text-align: left;
  transition: 0.2s ease;
}

.mode-card i {
  color: #1897a0;
}

.mode-card:hover {
  transform: translateY(-1px);
  border-color: #1897a0;
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
  border-color: #c4a484;
  background: #fffdf8;
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
  position: relative;
  height: 34px;
  display: flex;
  align-items: center;
}

.slider-track {
  position: absolute;
  width: 100%;
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

@media (max-width: 991px) {
  .filter-panel {
    position: static;
  }
}
</style>
