<script setup>
import { computed } from 'vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  islands: {
    type: Array,
    default: () => []
  }
})

const selectedIsland = computed(() => {
  return props.islands.find(island => Number(island.id) === Number(props.form.island_id))
})
</script>

<template>
  <div class="preview-card">
    <img
      v-if="form.coverImage"
      :src="form.coverImage.previewUrl"
      class="preview-cover"
      alt="Cover preview"
    />

    <div>
      <span class="preview-label">
        {{ selectedIsland?.name || 'Selected island' }}
      </span>

      <h3>{{ form.title }}</h3>

      <p>{{ form.content }}</p>

      <div class="preview-meta">
        <span>{{ form.mood }}</span>
        <span>{{ form.is_public ? 'Public' : 'Private' }}</span>
        <span>{{ form.media.length }} photos</span>
        <span>{{ form.timeline.length }} activities</span>
        <span>{{ form.sightings.length }} sightings</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-card {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 22px;
  align-items: center;
}

.preview-cover {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border: 10px solid #fbf9f1;
  box-shadow: 0 8px 18px rgba(0,0,0,0.15);
  transform: rotate(-1deg);
}

.preview-label {
  color: #1897a0;
  font-weight: 800;
}

.preview-card h3 {
  color: #2f4858;
  font-weight: 900;
}

.preview-card p {
  color: #64748b;
  display: -webkit-box;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-meta span {
  padding: 6px 10px;
  border-radius: 999px;
  background: #deefec;
  color: #1897a0;
  font-size: 0.8rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .preview-card {
    grid-template-columns: 1fr;
  }
}
</style>