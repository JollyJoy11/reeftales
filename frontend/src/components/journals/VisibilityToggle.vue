<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="visibility-toggle-box">
    <div>
      <strong>Public Journal</strong>
      <small>Allow others to read your trip story</small>
    </div>

    <button
      type="button"
      class="visibility-switch"
      :class="{ active: modelValue }"
      @click="emit('update:modelValue', !modelValue)"
    >
      <span></span>
    </button>
  </div>
</template>

<style scoped>
.visibility-toggle-box {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 16px;
  border-radius: 18px;
  background: #fbf9f1;
  border: 1px dashed #c4a484;
}

.visibility-toggle-box small {
  display: block;
  color: #64748b;
}

.visibility-switch {
  width: 58px;
  height: 32px;
  border: none;
  border-radius: 999px;
  padding: 4px;
  background: #d8cdbb;
}

.visibility-switch span {
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  transition: 0.2s ease;
}

.visibility-switch.active {
  background: #1897a0;
}

.visibility-switch.active span {
  transform: translateX(26px);
}
</style>