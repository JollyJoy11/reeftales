<script setup>
import { onMounted, watch, ref } from 'vue'
import L from 'leaflet'

const props = defineProps({
  discoveryMode: {
    type: String,
    required: true
  },
  islands: {
    type: Array,
    default: () => []
  },
  speciesList: {
    type: Array,
    default: () => []
  }
})

const mapContainer = ref(null)
let map = null
let markersLayer = null

function createMap() {
  map = L.map(mapContainer.value).setView([4.2105, 101.9758], 4)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
}

function renderMarkers() {
  if (!map || !markersLayer) return

  markersLayer.clearLayers()

  if (props.discoveryMode === 'islands') {
    props.islands.forEach((island) => {
      if (!island.latitude || !island.longitude) return

      const marker = L.marker([island.latitude, island.longitude])

      marker.bindPopup(`
        <strong>${island.name}</strong><br>
        <span>${island.location || ''}, ${island.country || ''}</span><br>
        <a href="/discovery/island/${island.id}">View island</a>
      `)

      markersLayer.addLayer(marker)
    })
  } else {
    props.speciesList.forEach((species, index) => {
      const lat = 4 + index * 2
      const lng = 100 + index * 4

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#1897a0',
        fillColor: '#1897a0',
        fillOpacity: 0.8
      })

      marker.bindPopup(`
        <strong>${species.name}</strong><br>
        <span>${species.scientific_name || ''}</span>
      `)

      markersLayer.addLayer(marker)
    })
  }
}

onMounted(() => {
  createMap()
  renderMarkers()
})

watch(
  () => [props.discoveryMode, props.islands, props.speciesList],
  () => {
    renderMarkers()
  },
  { deep: true }
)
</script>

<template>
  <div class="discovery-map" ref="mapContainer"></div>
</template>

<style scoped>
.discovery-map {
  width: 100%;
  min-height: 70vh;
  border-radius: 12px;
  border: 1px solid #eadfca;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}
</style>