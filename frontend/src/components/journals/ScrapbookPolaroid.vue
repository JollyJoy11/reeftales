<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  },
  showVideoBadge: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <span v-if="item.attachment === 'clip'" class="paper-clip"></span>
  <span v-else class="washi-tape"></span>

  <span v-if="showVideoBadge && item.mediaType === 'video'" class="layout-video-badge">
    <i class="bi bi-play-fill"></i>
  </span>

  <video
    v-if="item.mediaType === 'video'"
    :src="item.mediaUrl || item.previewUrl"
    :poster="item.previewUrl"
    class="scrapbook-polaroid-media"
    controls
    playsinline
    preload="metadata"
  ></video>

  <img
    v-else
    :src="item.previewUrl"
    class="scrapbook-polaroid-media"
    alt="Arranged journal media"
  />

  <span v-if="item.caption" class="scrapbook-polaroid-caption">
    {{ item.caption }}
  </span>
</template>

<style scoped>
.scrapbook-polaroid-media {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #fbf9f1;
  border: 2px solid #475569;
}

video.scrapbook-polaroid-media {
  background: #102f3a;
}

.washi-tape {
  position: absolute;
  top: -18px;
  left: 50%;
  z-index: 4;
  width: 92px;
  height: 24px;
  background: color-mix(in srgb, var(--tape-color) 72%, transparent);
  border-left: 1px dashed rgba(0,0,0,0.12);
  border-right: 1px dashed rgba(0,0,0,0.12);
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  transform: translateX(-50%) rotate(-2deg);
}

:global(.tape-top-left) .washi-tape {
  left: 22%;
  transform: translateX(-50%) rotate(-8deg);
}

:global(.tape-top-right) .washi-tape {
  left: 78%;
  transform: translateX(-50%) rotate(7deg);
}

.paper-clip {
  position: absolute;
  top: -19px;
  left: 18px;
  z-index: 5;
  width: 20px;
  height: 44px;
  border: 3px solid #7c8b97;
  border-bottom-color: transparent;
  border-radius: 999px 999px 8px 8px;
  transform: rotate(-12deg);
  box-shadow: inset 0 0 0 3px #ffffff;
}

.layout-video-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(31, 78, 95, 0.85);
  color: #fff;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.scrapbook-polaroid-caption {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 7px;
  color: #475569;
  font-family: 'Spectral', serif;
  font-size: 0.78rem;
  font-style: italic;
  font-weight: 700;
  line-height: 1.15;
  overflow: hidden;
  text-align: center;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
