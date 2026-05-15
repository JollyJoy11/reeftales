<script setup>
defineProps({
  discoveryMode: {
    type: String,
    required: true
  },
  viewMode: {
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
  selectedDepths: {
    type: Array,
    required: true
  }
})

const emit = defineEmits([
  'update:discoveryMode',
  'update:viewMode',
  'update:search',
  'update:selectedContinents',
  'update:selectedActivities',
  'update:selectedSpeciesTypes',
  'update:selectedDepths',
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

const depthOptions = [
  '0-10m',
  '10-30m',
  '30-60m',
  '60m+'
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
    <h5 class="fw-bold mb-3">Discovery Filters</h5>

    <!-- Discovery Mode -->
    <div class="filter-section">
      <label class="form-label fw-semibold">Discovery Mode</label>

      <div class="segmented-control">
        <button
          class="segment-btn"
          :class="{ active: discoveryMode === 'islands' }"
          @click="emit('update:discoveryMode', 'islands')"
        >
          🏝️ Islands
        </button>

        <button
          class="segment-btn"
          :class="{ active: discoveryMode === 'marine' }"
          @click="emit('update:discoveryMode', 'marine')"
        >
          🪸 Marine
        </button>
      </div>
    </div>

    <!-- Search -->
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

    <!-- Island Filters -->
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

    <!-- Marine Filters -->
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
        <label class="form-label fw-semibold">Depth Range</label>

        <div
          v-for="item in depthOptions"
          :key="item"
          class="form-check"
        >
          <input
            class="form-check-input"
            type="checkbox"
            :checked="selectedDepths.includes(item)"
            @change="toggleArrayValue(selectedDepths, item, 'update:selectedDepths')"
            :id="`depth-${item}`"
          />

          <label class="form-check-label" :for="`depth-${item}`">
            {{ item }}
          </label>
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
  top: 90px;
  padding: 20px;
  border-radius: 22px;
  background: #fbf9f1;
  border: 1px solid #eadfca;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.filter-section {
  margin-bottom: 22px;
}

.segmented-control {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 5px;
  border-radius: 999px;
  background: #efe7dc;
}

.segment-btn {
  border: none;
  border-radius: 999px;
  padding: 8px 10px;
  background: transparent;
  color: #2f4858;
  font-size: 0.85rem;
  font-weight: 600;
  transition: 0.2s ease;
}

.segment-btn.active {
  background: #D66967;
  color: white;
}

.form-control {
  border-color: #C4A484;
  background: #fffdf8;
}

.form-check {
  margin-bottom: 6px;
}

.form-check-input {
  border-color: #C4A484;
}

.form-check-input:checked {
  background-color: #D66967;
  border-color: #D66967;
}

@media (max-width: 991px) {
  .filter-panel {
    position: static;
  }
}
</style>