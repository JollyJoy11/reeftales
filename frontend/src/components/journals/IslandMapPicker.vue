<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  islands: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const mapEl = ref(null)
const pickerEl = ref(null)
const islandSearch = ref('')
const isDropdownOpen = ref(false)

let map = null
let layer = null

const selectedIsland = computed(() => {
  return props.islands.find(island => Number(island.id) === Number(props.modelValue))
})

const filteredIslands = computed(() => {
  const keyword = islandSearch.value.trim().toLowerCase()

  if (!keyword) return props.islands

  return props.islands.filter(island => islandMatchesSearch(island, keyword))
})

function selectIsland(id) {
  emit('update:modelValue', id)

  const island = props.islands.find(item => Number(item.id) === Number(id))

  if (island) {
    const detail = island.country || island.location || ''
    islandSearch.value = detail ? `${island.name} - ${detail}` : island.name
  }

  isDropdownOpen.value = false
}

function islandMatchesSearch(island, keyword) {
  const searchableText = [
    island.name,
    island.country,
    island.location,
    `${island.name || ''} - ${island.country || island.location || ''}`
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return keyword
    .split(/\s+/)
    .filter(Boolean)
    .every(term => searchableText.includes(term))
}

function handleSearchInput(event) {
  islandSearch.value = event.target.value
  isDropdownOpen.value = true
}

function openDropdown() {
  isDropdownOpen.value = true
}

function handleEscape() {
  isDropdownOpen.value = false
  syncSearchToSelection()
}

function handleDocumentClick(event) {
  if (!pickerEl.value?.contains(event.target)) {
    isDropdownOpen.value = false
    syncSearchToSelection()
  }
}

function selectedIslandLabel() {
  if (!selectedIsland.value) return ''

  const detail = selectedIsland.value.country || selectedIsland.value.location || ''
  return detail ? `${selectedIsland.value.name} - ${detail}` : selectedIsland.value.name
}

function syncSearchToSelection() {
  if (!isDropdownOpen.value && !islandSearch.value && selectedIsland.value) {
    islandSearch.value = selectedIslandLabel()
  }
}

function initMap() {
  if (map || !mapEl.value) return

  map = L.map(mapEl.value, {
    minZoom: 1,
    maxZoom: 8,
    worldCopyJump: false,
    maxBounds: [
      [-85, -180],
      [85, 180]
    ],
    maxBoundsViscosity: 1.0
  }).setView([4.2105, 101.9758], 4)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

  layer = L.layerGroup().addTo(map)
  renderMarkers()
}

function renderMarkers() {
  if (!layer) return

  layer.clearLayers()

  props.islands.forEach((island) => {
    if (!island.latitude || !island.longitude) return

    const isSelected = Number(props.modelValue) === Number(island.id)

    const marker = L.marker(
      [Number(island.latitude), Number(island.longitude)],
      {
        icon: L.divIcon({
          className: '',
          html: `
            <div class="island-marker ${isSelected ? 'selected' : ''}">
              <i class="bi bi-tsunami"></i>
            </div>
          `,
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        })
      }
    ).addTo(layer)

    marker.on('click', () => {
      selectIsland(island.id)
    })
  })
}

function focusSelectedIsland() {
  if (!map || !selectedIsland.value) return

  const lat = Number(selectedIsland.value.latitude)
  const lng = Number(selectedIsland.value.longitude)

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    map.setView([lat, lng], 7)
  }
}

watch(
  [() => props.islands, islandSearch],
  () => {
    syncSearchToSelection()
    renderMarkers()
  },
  { deep: true }
)

watch(
  () => props.modelValue,
  () => {
    islandSearch.value = selectedIslandLabel()
    renderMarkers()
    focusSelectedIsland()
  }
)

onMounted(async () => {
  await nextTick()
  initMap()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div class="island-map-picker">
    <label class="form-label fw-bold label-with-badge island-picker-label">
      Select Island
      <span class="requirement-badge required">Required</span>
    </label>

    <div ref="pickerEl" class="island-search-picker">
      <input
        :value="islandSearch"
        type="search"
        class="form-control"
        placeholder="Search island by name, country, or location..."
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="isDropdownOpen"
        aria-controls="island-search-results"
        @focus="openDropdown"
        @input="handleSearchInput"
        @keydown.escape="handleEscape"
      />

      <div
        v-if="isDropdownOpen && filteredIslands.length"
        id="island-search-results"
        class="island-search-results"
        role="listbox"
      >
        <button
          v-for="island in filteredIslands"
          :key="island.id"
          type="button"
          class="island-search-option"
          :class="{ selected: Number(modelValue) === Number(island.id) }"
          role="option"
          :aria-selected="Number(modelValue) === Number(island.id)"
          @click="selectIsland(island.id)"
        >
          <span>{{ island.name }}</span>
          <small>{{ island.location }} - {{ island.country }}</small>
        </button>
      </div>

      <div v-else-if="isDropdownOpen" class="island-search-empty">
        No island found.
      </div>
    </div>

    <div class="map-stamp-frame">
      <div ref="mapEl" class="map-picker"></div>
    </div>

    <div v-if="selectedIsland" class="selected-island-badge">
      <i class="bi bi-geo-fill"></i>
      <span>Selected island: </span>
      <strong>{{ selectedIsland.name }}</strong>
    </div>
  </div>
</template>

<style scoped>
.island-map-picker {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    "label"
    "search"
    "map";
  align-items: start;
  gap: 14px;
}

.island-picker-label {
  grid-area: label;
  margin-bottom: 0;
}

.map-stamp-frame {
  grid-area: map;
  background: #d2cab3;
  padding: 12px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.18);
  --r: 6px;
  --s: 18px;
  mask:
    radial-gradient(var(--r) at var(--r) 50%, transparent 98%, black)
      calc(-1 * var(--r)) 50% / 100% var(--s),
    radial-gradient(var(--r) at 50% var(--r), transparent 98%, black)
      50% calc(-1 * var(--r)) / var(--s) 100%;
  mask-composite: intersect;
}

.map-picker {
  height: clamp(260px, 34vw, 340px);
}

.selected-island-badge {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #deefec;
  color: #2f4858;
}

.bi-geo-fill {
  color: #1897a0;
  padding-right: 5px;
}

.label-with-badge {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.requirement-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.requirement-badge.required {
  background: #fff1f2;
  color: #b42334;
  border: 1px solid rgba(180,35,52,0.24);
}

.island-search-picker {
  grid-area: search;
  position: relative;
  min-width: 0;
}

.island-search-results {
  position: absolute;
  z-index: 1000;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  display: grid;
  gap: 8px;
  max-height: min(300px, 48vh);
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #eadfca;
  border-radius: 12px;
  background: #fffdf8;
  box-shadow: 0 18px 34px rgba(47,72,88,0.16);
}

.island-search-option {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  padding: 5px 12px;
  text-align: left;
}

.island-search-option:hover,
.island-search-option.selected {
  border-color: #1897a0;
  background: #deefec;
}

.island-search-option span {
  display: block;
  color: #2f4858;
  font-weight: 900;
}

.island-search-option small {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
}

.island-search-empty {
  position: absolute;
  z-index: 1000;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  padding: 12px;
  border: 1px dashed #eadfca;
  border-radius: 14px;
  color: #64748b;
  background: #fbf9f1;
  font-weight: 700;
  box-shadow: 0 16px 28px rgba(47,72,88,0.12);
}

@media (max-width: 991.98px) {
  .map-picker {
    height: 300px;
  }
}

:deep(.island-marker) {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #fffdf8;
  display: grid;
  place-items: center;
  font-size: 1.05rem;
  border: 2px solid #1897a0;
  color: #1897a0;
  box-shadow: 0 5px 14px rgba(0,0,0,0.18);
  transition: 0.2s ease;
  cursor: pointer;
}

:deep(.island-marker.selected) {
  background: #1897a0;
  color: white;
  transform: scale(1.2);
  box-shadow:
    0 0 0 7px rgba(24,151,160,0.18),
    0 10px 22px rgba(0,0,0,0.26);
}
</style>
