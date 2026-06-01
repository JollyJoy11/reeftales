<script setup>
import { onMounted, watch, ref, nextTick } from 'vue'
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

function createIslandIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div class="discovery-island-marker">
        <i class="bi bi-geo-alt-fill"></i>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -34]
  })
}

function islandPopup(island) {
  const image = island.cover_image || '/images/island-placeholder.jpg'
  const location = [island.location, island.country].filter(Boolean).join(', ')

  return `
    <a class="reef-popup-card" href="/discovery/island/${island.id}">
      <img src="${image}" alt="${island.name}" />

      <div class="reef-popup-content">
        <span>Island Destination</span>
        <strong>${island.name}</strong>
        <small>${location}</small>

        <div class="reef-popup-action">
          View island
          <i class="bi bi-arrow-right"></i>
        </div>
      </div>
    </a>
  `
}

function createMap() {
  map = L.map(mapContainer.value, {
    minZoom: 2,
    maxZoom: 7,
    scrollWheelZoom: true,
    worldCopyJump: false,
    maxBounds: [
      [-85, -180],
      [85, 180]
    ],
    maxBoundsViscosity: 1.0
  }).setView([4.2105, 101.9758], 4)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

  markersLayer = L.layerGroup().addTo(map)
}

function renderMarkers() {
  if (!map || !markersLayer) return

  markersLayer.clearLayers()

  if (props.discoveryMode !== 'islands') {
    map.setView([0, 150], 3)
    return
  }

  const bounds = []

  props.islands.forEach((island) => {
    const lat = Number(island.latitude)
    const lng = Number(island.longitude)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    bounds.push([lat, lng])

    L.marker([lat, lng], {
      icon: createIslandIcon()
    })
      .bindPopup(islandPopup(island), {
        closeButton: true,
        className: 'reef-map-popup',
        maxWidth: 240,
        autoPan: true,
        keepInView: true
      })
      .addTo(markersLayer)
  })

  if (bounds.length) {
    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 5
    })
  }
}

onMounted(async () => {
  await nextTick()
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
  <section class="discovery-map-shell">
    <div ref="mapContainer" class="discovery-map"></div>

    <div
      v-if="discoveryMode === 'marine'"
      class="marine-map-overlay"
    >
      <div class="marine-icon">
        <i class="bi bi-water"></i>
      </div>

      <div class="marine-content">
        <strong>Species habitat maps live inside each species profile</strong>

        <p>
          Open any marine species to explore habitat range,
          seasonal observations and global occurrence records.
        </p>

        <div class="marine-stats">
          {{ speciesList.length }} species available
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.discovery-map-shell {
  position: relative;
  border-radius: 22px;
  border: 1px solid #eadfca;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.discovery-map {
  width: 100%;
  min-height: 68vh;
}

.discovery-map.marine {
  filter: saturate(0.8) brightness(0.95);
}

.marine-map-overlay {
  position: absolute;
  left: 24px;
  bottom: 24px;
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 420px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255,253,248,0.96);
  border: 1px solid #eadfca;
  box-shadow:
    0 14px 30px rgba(47,72,88,0.12);
}

.marine-icon {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
}

.marine-icon i {
  font-size: 1.35rem;
}

.marine-content strong {
  display: block;
  color: #2f4858;
  font-size: 1rem;
  font-weight: 900;
}

.marine-content p {
  margin: 4px 0 8px;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.4;
}

.marine-stats {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #deefec;
  color: #1897a0;
  font-size: 0.75rem;
  font-weight: 900;
}

:global(.discovery-island-marker) {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #1897a0;
  color: white;
  border: 3px solid rgba(255,255,255,0.95);
  box-shadow: 0 8px 18px rgba(47,72,88,0.22);
}

:global(.discovery-island-marker i) {
  font-size: 1.15rem;
}

:global(.reef-map-popup .leaflet-popup-content-wrapper) {
  padding: 0;
  border-radius: 18px;
  overflow: hidden;
  background: #fffdf8;
  box-shadow: 0 14px 30px rgba(47,72,88,0.18);
}

:global(.reef-map-popup .leaflet-popup-content) {
  margin: 0;
  width: min(240px, calc(100vw - 72px)) !important;
}

:global(.reef-popup-card) {
  display: block;
  text-decoration: none;
  color: #2f4858;
}

:global(.reef-popup-card img) {
  width: 100%;
  height: 105px;
  object-fit: cover;
  display: block;
}

:global(.reef-popup-content) {
  padding: 12px;
}

:global(.reef-popup-content span) {
  display: block;
  color: #1897a0;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

:global(.reef-popup-content strong) {
  display: block;
  margin-top: 3px;
  color: #2f4858;
  font-size: 1rem;
  font-weight: 900;
}

:global(.reef-popup-content small) {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

:global(.reef-popup-action) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  color: #1897a0;
  font-size: 0.78rem;
  font-weight: 900;
}

@media (max-width: 768px) {
  .discovery-map {
    min-height: 48vh;
  }
  
  .marine-map-overlay {
    left: 12px;
    right: 12px;
    bottom: 12px;
    max-width: unset;
    padding: 14px;
  }

  .marine-content strong {
    font-size: 0.9rem;
  }

  .marine-content p {
    font-size: 0.8rem;
  }

  :global(.reef-map-popup .leaflet-popup-content) {
    width: min(210px, calc(100vw - 64px)) !important;
  }

  :global(.reef-popup-card img) {
    height: 82px;
  }

  :global(.reef-popup-content) {
    padding: 9px;
  }

  :global(.reef-popup-content strong) {
    font-size: 0.9rem;
  }

  :global(.reef-popup-content small),
  :global(.reef-popup-action) {
    font-size: 0.72rem;
  }
}
</style>