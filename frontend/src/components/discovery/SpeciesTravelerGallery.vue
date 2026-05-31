<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  media: {
    type: Array,
    default: () => []
  },
  speciesName: {
    type: String,
    default: 'Species'
  }
})
</script>

<template>
  <section class="species-section">
    <div class="section-heading">
      <span>Traveler Gallery</span>
      <h3>Photos linked to this species</h3>
      <p>Community media uploaded in public journals and tagged to this species.</p>
    </div>

    <div v-if="media.length" class="traveler-grid-scroll">
      <RouterLink
        v-for="(item, index) in media"
        :key="item.id"
        :to="`/journal/${item.journal_id}`"
        class="traveler-image-card"
        :class="`gallery-item-${index % 6}`"
      >
        <video
          v-if="item.media_type === 'video'"
          :src="item.media_url"
          muted
          playsinline
          preload="metadata"
        ></video>

        <img
          v-else
          :src="item.media_url"
          :alt="item.caption || speciesName"
        />

        <div class="traveler-image-overlay">
          <strong>{{ item.caption || item.journal_title || speciesName }}</strong>
          <span>
            {{ item.island_name }}
            <template v-if="item.username">
              · by {{ item.username }}
            </template>
          </span>
        </div>

        <i
          v-if="item.media_type === 'video'"
          class="bi bi-play-fill video-float-icon"
        ></i>
      </RouterLink>
    </div>

    <div v-else class="empty-panel">
      <i class="bi bi-images"></i>
      <strong>No traveler photos yet</strong>
      <span>Photos tagged to this species will appear here.</span>
    </div>
  </section>
</template>

<style scoped>
.species-section {
  margin-top: 28px;
}

.section-heading span {
  color: #1897a0;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.section-heading h3 {
  color: #2f4858;
  font-weight: 900;
  margin: 2px 0 4px;
}

.section-heading p {
  color: #64748b;
  margin-bottom: 14px;
}

.traveler-grid-scroll {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(2, 145px);
  grid-auto-columns: 190px;
  gap: 10px;
  overflow-x: auto;
  padding: 8px 4px 18px;
}

.traveler-image-card {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: #102f3a;
  text-decoration: none;
  border: 2px solid rgba(213, 209, 209, 0.9);
  box-shadow:
    0 12px 30px rgba(0,0,0,0.12);
}

.traveler-image-card:hover {
  border-color: #1897a0;
}

.gallery-item-0,
.gallery-item-1,
.gallery-item-4,
.gallery-item-5 {
  grid-row: span 1;
  grid-column: span 1;
}

.gallery-item-2,
.gallery-item-3 {
  grid-row: span 2;
  grid-column: span 2;
}

.traveler-image-card img,
.traveler-image-card video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: 0.24s ease;
}

.traveler-image-card:hover img,
.traveler-image-card:hover video {
  transform: scale(1.05);
}

.traveler-image-overlay {
  position: absolute;
  inset: auto 0 0;
  padding: 38px 14px 14px;
  background:
    linear-gradient(
      180deg,
      rgba(16,47,58,0),
      rgba(16,47,58,0.88)
    );
  color: white;
  transform: translateY(18px);
  opacity: 0;
  transition: 0.2s ease;
}

.traveler-image-card:hover .traveler-image-overlay {
  transform: translateY(0);
  opacity: 1;
}

.traveler-image-overlay strong,
.traveler-image-overlay span {
  display: block;
}

.traveler-image-overlay strong {
  font-size: 0.9rem;
  font-weight: 900;
}

.traveler-image-overlay span {
  font-size: 0.76rem;
  opacity: 0.88;
}

.video-float-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(24,151,160,0.92);
  color: white;
}

.empty-panel {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 28px;
  border-radius: 22px;
  border: 1px dashed #d8cdbb;
  background: #fbf9f1;
  color: #64748b;
  text-align: center;
}

.empty-panel i {
  color: #1897a0;
  font-size: 1.7rem;
}

.empty-panel strong {
  color: #2f4858;
}
</style>