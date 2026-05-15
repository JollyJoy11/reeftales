<script setup>
defineProps({
  image: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="stamp">
    <img :src="image" alt="Stamp image" />
  </div>
</template>

<style scoped>
.stamp {
  position: absolute;
  top: 40px;
  right: 30px;
  width: 100px;
  height: 100px;
  background-color: #ffffff;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transform: rotate(15deg);
  transition: transform 0.3s ease;
  z-index: 5;

  --r: 4px;
  --s: 12px;

  mask:
    radial-gradient(var(--r) at var(--r) 50%, transparent 98%, black)
      calc(-1*var(--r)) 50% / 100% var(--s),
    radial-gradient(var(--r) at 50% var(--r), transparent 98%, black)
      50% calc(-1*var(--r)) / var(--s) 100%;
  mask-composite: intersect;
}

.stamp:hover {
  transform: rotate(8deg) scale(1.03);
}

.stamp img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid rgba(0,0,0,0.15);
}
</style>