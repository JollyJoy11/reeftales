<script setup>
import { computed } from 'vue'

const props = defineProps({
  species: {
    type: Object,
    required: true
  },
  tiltVariant: {
    type: Number,
    default: 0
  }
})

function splitTags(value) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
  }

  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

const tags = computed(() => splitTags(props.species.tags))
</script>

<template>
  <article class="species-label-card h-100">
    <div class="stamp-image-area" :class="`stamp-tilt-${tiltVariant % 3}`">
      <img
        :src="species.image_url || '/images/species-placeholder.jpg'"
        class="species-image"
        alt="Marine species image"
      />
    </div>

    <div class="label-body">
      <h4>{{ species.name }}</h4>

      <p class="subtitle">
        {{ species.conservation_status || 'Unknown status' }}
        •
        {{ species.scientific_name || 'Scientific name unavailable' }}
      </p>

      <div class="info-grid">
        <div>
          <span>Habitats</span>
          <strong>{{ species.habitats || 'Not specified' }}</strong>
        </div>

        <div>
          <span>Depth</span>
          <strong>{{ species.depth_range || 'Unknown' }}</strong>
        </div>
      </div>

      <p class="species-desc">
        {{ species.description }}
      </p>

      <div class="badge-section">
        <span
          v-for="tag in tags"
          :key="tag"
          class="badge rounded-pill species-badge"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.species-label-card {
  padding: 12px;
  background: #deefec;
  transition: transform 0.2s ease;
  transform: rotate(0.4deg);

  --r: 5px;
  --s: 15px;

  mask:
    radial-gradient(var(--r) at var(--r) 50%, transparent 98%, black)
      calc(-1*var(--r)) 50% / 100% var(--s),
    radial-gradient(var(--r) at 50% var(--r), transparent 98%, black)
      50% calc(-1*var(--r)) / var(--s) 100%;
  mask-composite: intersect;
}

.species-label-card:hover {
  transform: rotate(0deg) translateY(-4px);
}

.stamp-image-area {
  height: 200px;
  background: #f6f3eb;
  margin: 10px;
  padding: 10px 8px 24px 8px;
  overflow: hidden;
  box-shadow: 0 6px 10px rgba(0,0,0,0.18);
}

.stamp-image-area.stamp-tilt-0 {
  transform: rotate(-1.5deg);
}

.stamp-image-area.stamp-tilt-1 {
  transform: rotate(1deg);
}

.stamp-image-area.stamp-tilt-2 {
  transform: rotate(-0.5deg);
}

.species-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 2px solid #475569;
}

.label-body {
  padding: 10px 12px 18px;
  color: #1e293b;
}

.label-body h4 {
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.subtitle {
  text-align: center;
  font-size: 0.78rem;
  color: #64748b;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #9fb8c3;
  border-bottom: 1px solid #9fb8c3;
  margin: 12px 0;
}

.info-grid div {
  padding: 8px;
}

.info-grid div:first-child {
  border-right: 1px solid #9fb8c3;
}

.info-grid span {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
}

.info-grid strong {
  font-size: 0.78rem;
}

.species-desc {
  font-size: 0.82rem;
  color: #475569;
  display: block;
  line-clamp: 2;
  overflow: hidden;
}

.badge-section {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.species-badge {
  background: #e0f2fe;
  color: #0369a1;
}
</style>