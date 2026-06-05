<script setup>
import { ref } from 'vue'
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

const galleryScrollRef = ref(null)

function handleGalleryWheel(event) {
  if (window.matchMedia('(max-width: 768px)').matches) return

  const strip = galleryScrollRef.value
  if (!strip || strip.scrollWidth <= strip.clientWidth) return
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

  const maxScroll = strip.scrollWidth - strip.clientWidth
  const nextScroll = Math.max(0, Math.min(maxScroll, strip.scrollLeft + event.deltaY))

  if (nextScroll === strip.scrollLeft) return

  event.preventDefault()
  strip.scrollLeft = nextScroll
}
</script>

<template>
  <section class="species-section">
    <div class="section-heading">
      <span>Traveler Gallery</span>
      <h3>Photos linked to this species</h3>
      <p>Community media uploaded in public journals and tagged to this species.</p>
    </div>

    <div
      v-if="media.length"
      ref="galleryScrollRef"
      class="traveler-grid-scroll"
      @wheel="handleGalleryWheel"
    >
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
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.section-heading h3 {
  color: var(--text-primary);
  font-weight: 900;
  margin: 2px 0 4px;
}

.section-heading p {
  color: var(--text-secondary);
  margin-bottom: 14px;
}

.traveler-grid-scroll {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(2, 165px);
  grid-auto-columns: 210px;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-inline: contain;
  padding: 22px 18px 28px;
  border: 1px dashed var(--border);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255,253,248,0.94), rgba(246,236,220,0.88)),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(196,164,132,0.12) 32px);
  box-shadow: inset 0 0 30px rgba(196,164,132,0.08);
  scroll-padding-inline: 18px;
  scroll-snap-type: inline mandatory;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--accent-rgb),0.38) transparent;
}

.traveler-image-card {
  position: relative;
  overflow: visible;
  padding: 10px 10px 44px;
  border-radius: 6px;
  background: #fffdf8;
  text-decoration: none;
  border: 1px solid rgba(196,164,132,0.3);
  box-shadow:
    0 16px 32px rgba(47,72,88,0.14),
    inset 0 0 0 1px rgba(255,255,255,0.7);
  scroll-snap-align: start;
  transform: rotate(var(--card-tilt, 0deg));
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.traveler-image-card:hover {
  border-color: rgba(var(--accent-rgb),0.48);
  box-shadow:
    0 20px 40px rgba(15,143,152,0.16),
    inset 0 0 0 1px rgba(255,255,255,0.78);
  transform: rotate(var(--card-tilt, 0deg)) translateY(-3px);
}

.traveler-image-card::before {
  content: '';
  position: absolute;
  top: -9px;
  left: 50%;
  z-index: 3;
  width: 70px;
  height: 20px;
  transform: translateX(-50%) rotate(-3deg);
  background: rgba(245,223,154,0.58);
  border-left: 1px dashed rgba(47,72,88,0.08);
  border-right: 1px dashed rgba(47,72,88,0.08);
}

.gallery-item-0 {
  --card-tilt: -2deg;
}

.gallery-item-1 {
  --card-tilt: 1.5deg;
}

.gallery-item-2 {
  --card-tilt: -1deg;
}

.gallery-item-3 {
  --card-tilt: 1deg;
}

.gallery-item-4 {
  --card-tilt: -1.5deg;
}

.gallery-item-5 {
  --card-tilt: 2deg;
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
  height: calc(100% - 6px);
  object-fit: cover;
  border: 1px solid rgba(47,72,88,0.14);
  border-radius: 3px;
  background: #102f3a;
}

.traveler-image-overlay {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  display: grid;
  gap: 1px;
  color: var(--text-primary);
}

.traveler-image-overlay strong,
.traveler-image-overlay span {
  display: block;
}

.traveler-image-overlay strong {
  overflow: hidden;
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.traveler-image-overlay span {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  background: rgba(var(--accent-rgb),0.92);
  color: white;
  box-shadow: 0 8px 18px rgba(47,72,88,0.16);
}

.empty-panel {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 28px;
  border-radius: 22px;
  border: 1px dashed var(--border);
  background: var(--surface-soft);
  color: var(--text-secondary);
  text-align: center;
}

.empty-panel i {
  color: var(--accent);
  font-size: 1.7rem;
}

.empty-panel strong {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .traveler-grid-scroll {
    grid-auto-flow: row;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-columns: unset;
    grid-template-rows: none;
    gap: 14px;
    max-height: min(680px, 72vh);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-block: contain;
    padding: 18px 14px 24px;
    scroll-padding-block: 18px;
    scroll-snap-type: block proximity;
  }

  .gallery-item-0,
  .gallery-item-1,
  .gallery-item-2,
  .gallery-item-3,
  .gallery-item-4,
  .gallery-item-5 {
    grid-row: auto;
    grid-column: auto;
  }

  .gallery-item-0,
  .gallery-item-3 {
    grid-column: 1 / -1;
  }

  .traveler-image-card {
    min-height: 210px;
    padding: 9px 9px 42px;
    scroll-snap-align: start;
  }

  .gallery-item-0,
  .gallery-item-3 {
    min-height: 300px;
  }

  .traveler-image-overlay strong {
    font-size: 0.78rem;
  }

  .traveler-image-overlay span {
    font-size: 0.66rem;
  }
}

@media (max-width: 460px) {
  .traveler-grid-scroll {
    grid-template-columns: 1fr;
    max-height: min(620px, 74vh);
  }

  .traveler-image-card,
  .gallery-item-0,
  .gallery-item-3 {
    min-height: 270px;
  }
}
</style>
