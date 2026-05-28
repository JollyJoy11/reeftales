<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:text'])
</script>

<template>
  <textarea
    v-if="editable"
    :value="item.text"
    class="scrapbook-text-note"
    :style="{ backgroundColor: item.textColor || '#fff8d9' }"
    @input="emit('update:text', $event.target.value)"
  ></textarea>

  <p
    v-else
    class="scrapbook-text-note read-only"
    :style="{ backgroundColor: item.textColor || '#fff8d9' }"
  >
    {{ item.text }}
  </p>
</template>

<style scoped>
.scrapbook-text-note {
  width: 100%;
  height: 100%;
  margin: 0;
  border: none;
  resize: none;
  background: #fff8d9;
  color: #2f4858;
  font-family: 'Spectral', serif;
  font-size: 1rem;
  font-style: italic;
  font-weight: 700;
  padding: 12px;
  outline: none;
}

.scrapbook-text-note.read-only {
  border: 1px dashed #d7be8c;
  overflow: hidden;
}
</style>
