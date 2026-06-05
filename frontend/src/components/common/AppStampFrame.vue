<script setup>
defineProps({
  image: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  clickable: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: false
  },
  contain: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <span
    class="app-stamp-frame"
    :class="{ clickable, active, contain }"
  >
    <img
      v-if="image"
      :src="image"
      :alt="alt"
      @load="$emit('load', $event)"
      @error="$emit('error', $event)"
    />
    <slot v-else></slot>
  </span>
</template>

<style scoped>
.app-stamp-frame {
  --stamp-radius: 4px;
  --stamp-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 8px;
  background: #e5dbb4;
  box-shadow: 0 8px 18px rgba(47,72,88,0.16);
  transition:
    box-shadow 0.16s ease,
    transform 0.16s ease;
  overflow: hidden;
  mask:
    radial-gradient(var(--stamp-radius) at var(--stamp-radius) 50%, transparent 98%, black)
      calc(-1*var(--stamp-radius)) 50% / 100% var(--stamp-size),

    radial-gradient(var(--stamp-radius) at 50% var(--stamp-radius), transparent 98%, black)
      50% calc(-1*var(--stamp-radius)) / var(--stamp-size) 100%;

  mask-composite: intersect;
}

.app-stamp-frame.clickable:hover,
.app-stamp-frame.active {
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb),0.14), 0 10px 20px rgba(47,72,88,0.18);
}

.app-stamp-frame.active {
  background: #bcd6d1;
}

.app-stamp-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  background: #f8f5ea;
  border: 1px solid rgba(47,72,88,0.18);
}

.app-stamp-frame:not(.contain) img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
