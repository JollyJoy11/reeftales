<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
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
let map = null
let layer = null

const selectedIsland = computed(() => {
  return props.islands.find(island => Number(island.id) === Number(props.modelValue))
})

function selectIsland(id) {
  emit('update:modelValue', id)
}

function initMap() {
  if (map || !mapEl.value) return

  map = L.map(mapEl.value).setView([4.2105, 101.9758], 4)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

  layer = L.layerGroup().addTo(map)
  renderMarkers()
}

function renderMarkers() {
  if (!layer) return

  layer.clearLayers()

  props.islands.forEach((island) => {
    if (!island.latitude || !island.longitude) return

    const isSelected =
      Number(props.modelValue) === Number(island.id)

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

  if (lat && lng) {
    map.setView([lat, lng], 7)
  }
}

watch(
  () => props.islands,
  () => {
    renderMarkers()
  },
  { deep: true, immediate: true }
)

watch(() => props.modelValue, () => {
	renderMarkers()
  focusSelectedIsland()
})

onMounted(async () => {
  await nextTick()
  initMap()
})
</script>

<template>
  <div>
    <label class="form-label fw-bold">Select Island</label>

    <select
      :value="modelValue"
      class="form-select mb-3"
      @change="selectIsland($event.target.value)"
    >
      <option value="">Choose an island</option>

      <option
        v-for="island in islands"
        :key="island.id"
        :value="island.id"
      >
        {{ island.name }} — {{ island.country }}
      </option>
    </select>

    <div ref="mapEl" class="map-picker"></div>

    <div v-if="selectedIsland" class="selected-island-badge">
      <i class="bi bi-geo-fill"></i>

      <span>Selected island: </span>

      <strong>{{ selectedIsland.name }}</strong>
    </div>
  </div>
</template>

<style scoped>
.map-picker {
  height: 300px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #eadfca;
}

.selected-island-badge {
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #deefec;
  color: #2f4858;
}

.island-marker {
	cursor: pointer;
}

.bi-geo-fill {
  color: #1897a0;
  padding-right: 5px;
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