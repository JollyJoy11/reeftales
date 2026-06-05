<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import AppStampFrame from '@/components/common/AppStampFrame.vue'

const props = defineProps({
  mediaItems: {
    type: Array,
    default: () => []
  },
  selectedMediaId: {
    type: [String, Number],
    default: 'cover'
  },
  coverImage: {
    type: String,
    default: '/images/island-placeholder.jpg'
  }
})

const emit = defineEmits(['update:selectedMediaId'])

const mediaStripRef = ref(null)
const canScrollMediaUp = ref(false)
const canScrollMediaDown = ref(false)

const selectedMedia = computed(() => {
  return props.mediaItems.find(item => String(item.id) === String(props.selectedMediaId)) ||
    props.mediaItems[0]
})

const selectedMediaAlt = computed(() => {
  return selectedMedia.value?.label || 'Selected journal media'
})

function selectMedia(mediaId) {
  emit('update:selectedMediaId', mediaId)
}

function scrollMediaStrip(direction) {
  const strip = mediaStripRef.value
  if (!strip) return

  const isHorizontal = strip.scrollWidth > strip.clientWidth

  strip.scrollBy({
    top: isHorizontal ? 0 : direction * 92,
    left: isHorizontal ? direction * 86 : 0,
    behavior: 'smooth'
  })
}

function updateMediaScrollState() {
  const strip = mediaStripRef.value
  if (!strip) return

  const isHorizontal = strip.scrollWidth > strip.clientWidth

  canScrollMediaUp.value = isHorizontal
    ? strip.scrollLeft > 2
    : strip.scrollTop > 2

  canScrollMediaDown.value = isHorizontal
    ? strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 2
    : strip.scrollTop + strip.clientHeight < strip.scrollHeight - 2
}

watch(
  () => props.mediaItems.length,
  async () => {
    await nextTick()
    updateMediaScrollState()
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('resize', updateMediaScrollState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMediaScrollState)
})
</script>

<template>
  <div class="cover-media-cluster">
    <div class="media-strip-shell">
      <button
        type="button"
        class="media-scroll-btn top"
        aria-label="Scroll media up"
        :disabled="!canScrollMediaUp"
        @click="scrollMediaStrip(-1)"
      >
        <i class="bi bi-chevron-up"></i>
      </button>

      <div
        ref="mediaStripRef"
        class="media-side-strip"
        aria-label="Journal media"
        @scroll="updateMediaScrollState"
      >
        <button
          v-for="item in mediaItems"
          :key="item.id"
          type="button"
          class="media-thumb"
          :class="{ active: String(selectedMedia?.id) === String(item.id) }"
          @click="selectMedia(item.id)"
        >
          <AppStampFrame
            :image="item.type === 'video' ? '' : item.url"
            :alt="item.label"
            :active="String(selectedMedia?.id) === String(item.id)"
            clickable
            contain
            @load="updateMediaScrollState"
            @error="$event.target.src = '/images/island-placeholder.jpg'"
          >
            <span v-if="item.type === 'video'" class="media-video-thumb">
              <video :src="item.url" muted playsinline preload="metadata"></video>
              <i class="bi bi-play-fill"></i>
            </span>
          </AppStampFrame>
        </button>
      </div>

      <button
        type="button"
        class="media-scroll-btn bottom"
        aria-label="Scroll media down"
        :disabled="!canScrollMediaDown"
        @click="scrollMediaStrip(1)"
      >
        <i class="bi bi-chevron-down"></i>
      </button>
    </div>

    <div class="journal-cover-frame">
      <Transition name="media-swap" mode="out-in">
        <video
          v-if="selectedMedia?.type === 'video'"
          :key="`video-${selectedMedia?.id}`"
          :src="selectedMedia?.url"
          class="journal-cover journal-cover-video"
          controls
          playsinline
          preload="metadata"
        ></video>
        <img
          v-else
          :key="`image-${selectedMedia?.id}`"
          :src="selectedMedia?.url || coverImage"
          class="journal-cover"
          :alt="selectedMediaAlt"
          @error="$event.target.src = '/images/island-placeholder.jpg'"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.cover-media-cluster {
  display: grid;
  grid-template-columns: 93px minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin-bottom: 18px;
}

.media-strip-shell {
  --media-strip-padding: 14px;
  --media-stamp-size: 78px;
  --media-strip-center: calc(var(--media-strip-padding) + (var(--media-stamp-size) / 2));

  position: relative;
  align-self: start;
  z-index: 2;
  min-width: 0;
  height: max-content;
  transform: translate(20px, 18px);
  box-shadow:
    6px 0 12px rgba(0,0,0,0.05);
}

.media-side-strip {
  display: grid;
  align-content: start;
  gap: 5px;
  max-height: 240px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 28px var(--media-strip-padding);
  scroll-padding-block: 28px;
  scrollbar-width: none;
  mask-image: linear-gradient(
    180deg,
    transparent 0,
    #000 26px,
    #000 calc(100% - 26px),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    180deg,
    transparent 0,
    #000 26px,
    #000 calc(100% - 26px),
    transparent 100%
  );
}

.media-side-strip::-webkit-scrollbar {
  display: none;
}

.media-scroll-btn {
  position: absolute;
  left: var(--media-strip-center);
  z-index: 6;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: var(--accent);
  color: #ffffff;
  display: grid;
  place-items: center;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
  transition:
    background-color 0.16s ease,
    opacity 0.16s ease,
    transform 0.16s ease;
  box-shadow: 0 8px 18px rgba(47,72,88,0.16);
}

.media-scroll-btn.top {
  top: -8px;
}

.media-scroll-btn.bottom {
  bottom: -8px;
}

.media-strip-shell:hover .media-scroll-btn {
  opacity: 1;
  pointer-events: auto;
}

.media-scroll-btn:hover:not(:disabled) {
  background: #147d85;
  transform: translateX(-50%) translateY(-1px);
}

.media-scroll-btn:disabled {
  background: #b1c2ca;
  opacity: 0;
  cursor: not-allowed;
}

.media-thumb {
  border: none;
  background: transparent;
  padding: 4px 0;
  transition:
    transform 0.16s ease,
    filter 0.16s ease;
}

.media-thumb :deep(.app-stamp-frame) {
  width: var(--media-stamp-size);
  aspect-ratio: 1;
}

.media-video-thumb {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #102f3a;
  border: 1px solid rgba(47,72,88,0.18);
}

.media-video-thumb video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.media-video-thumb i {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(var(--accent-rgb),0.9);
  color: #ffffff;
  font-size: 1rem;
  box-shadow: 0 6px 14px rgba(47,72,88,0.2);
}

.media-thumb img {
  filter:
    saturate(0.88)
    contrast(0.96);
}

.media-thumb:nth-child(odd) {
  transform: rotate(-2deg);
}

.media-thumb:nth-child(even) {
  transform: rotate(2deg);
}

.media-thumb:hover,
.media-thumb.active {
  filter: drop-shadow(0 0 10px rgba(var(--accent-rgb),0.2));
  transform: rotate(0deg) translateY(-2px);
}

.journal-cover-frame {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background:
    linear-gradient(
      180deg,
      #fdfcf8 0%,
      #f5efe3 100%
    );
  padding: 16px;
  border: 1px solid rgba(196,164,132,0.25);
  box-shadow:
    0 14px 30px rgba(0,0,0,0.12),
    inset 0 0 18px rgba(255,255,255,0.4);
  border-radius: 4px;
  transform: rotate(-0.5deg);
}

.journal-cover {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  background: #f8f5ea;
}

.journal-cover-video {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  background: #102f3a;
}

.journal-cover-frame::before {
  content: '';
  position: absolute;
  top: -12px;
  left: 50%;
  width: 120px;
  height: 26px;
  transform:
    translateX(-50%)
    rotate(2deg);
  background: rgba(141, 185, 183, 0.28);
  backdrop-filter: blur(2px);
  border-left: 1px dashed rgba(0,0,0,0.12);
  border-right: 1px dashed rgba(0,0,0,0.12);
}

.media-swap-enter-active,
.media-swap-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.media-swap-enter-from,
.media-swap-leave-to {
  opacity: 0;
  transform: scale(0.985);
}

@media (max-width: 768px) {
  .cover-media-cluster {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .media-side-strip {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    max-height: none;
    padding: 14px 10px;
    scroll-padding-inline: 14px;
    width: 100%;
    min-width: 0;
    margin: 0;
    mask-image: linear-gradient(
      90deg,
      transparent 0,
      #000 24px,
      #000 calc(100% - 24px),
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      90deg,
      transparent 0,
      #000 24px,
      #000 calc(100% - 24px),
      transparent 100%
    );
  }

  .media-strip-shell {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) 34px;
    align-items: center;
    gap: 8px;
    transform: none;
    width: 100%;
    max-width: 100%;
    box-shadow: none;
  }

  .journal-cover-frame {
    padding: 10px;
    transform: none;
  }

  .media-scroll-btn {
    position: static;
    width: 34px;
    height: 34px;
    opacity: 1;
    pointer-events: auto;
    transform: none;
  }

  .media-scroll-btn.top {
    grid-column: 1;
    grid-row: 1;
  }

  .media-scroll-btn.bottom {
    grid-column: 3;
    grid-row: 1;
  }

  .media-scroll-btn.top i,
  .media-scroll-btn.bottom i {
    transform: rotate(-90deg);
  }

  .media-scroll-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .media-scroll-btn:disabled {
    opacity: 0.35;
  }

  .media-thumb :deep(.app-stamp-frame) {
    width: 62px;
  }
}
</style>

