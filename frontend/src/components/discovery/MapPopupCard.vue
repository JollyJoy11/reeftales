<template>
  <RouterLink
    v-if="type === 'island'"
    :to="`/islands/${item.id}`"
    class="map-popup-card"
  >
    <strong>{{ item.name }}</strong>
    <span>{{ item.location }}, {{ item.country }}</span>
  </RouterLink>

  <div v-else class="map-popup-card">
    <strong>{{ item.name }}</strong>
    <span>{{ item.scientific_name }}</span>
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    default: 'island'
  }
})
</script>

<style scoped>
.map-popup-card {
  display: block;
  min-width: 170px;
  text-decoration: none;
  color: #2f4858;
}

.map-popup-card strong,
.map-popup-card span {
  display: block;
}

.map-popup-card strong {
  font-weight: 800;
}

.map-popup-card span {
  font-size: 0.8rem;
  color: #64748b;
}
</style>