<script setup>
import { computed } from 'vue'

const props = defineProps({
  days: {
    type: Array,
    default: () => []
  },
  selectedDay: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:selectedDay'])

const activeDay = computed(() => {
  if (!props.days.length) return null

  return props.days.find(day => day.dayNumber === props.selectedDay) ||
    props.days[0]
})

function activityTitle(activity) {
  return activity.activity_name || activity.custom_activity_name || 'Untitled activity'
}

function formatActivityTime(time) {
  if (!time) return ''
  return String(time).slice(0, 5)
}
</script>

<template>
  <div class="detail-section timeline-section">
    <h2>Timeline</h2>
    <div v-if="days.length" class="timeline-day-tabs">
      <button
        v-for="day in days"
        :key="day.dayNumber"
        type="button"
        :class="{ active: activeDay?.dayNumber === day.dayNumber }"
        @click="emit('update:selectedDay', day.dayNumber)"
      >
        Day {{ day.dayNumber }}
      </button>
    </div>
    <Transition v-if="days.length" name="timeline-slide" mode="out-in">
      <div
        v-if="activeDay"
        :key="activeDay.dayNumber"
        class="timeline-log"
      >
        <article
          v-for="(activity, index) in activeDay.activities"
          :key="activity.id"
          class="timeline-entry"
          :class="{ last: index === activeDay.activities.length - 1 }"
        >
          <div class="timeline-rail">
            <span class="timeline-dot" :class="{ hollow: index > 0 }"></span>
          </div>
          <div class="timeline-card">
            <span class="timeline-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-parasol-icon lucide-parasol"><path d="M12.5 11.134 18.196 21"/><path d="M20.425 5.299a10 10 0 0 0-16.941 9.78c.183.563.843.774 1.355.478L20.16 6.711c.512-.296.66-.973.264-1.413"/><path d="M21 21H3"/></svg>
            </span>
            <div>
              <strong>{{ activityTitle(activity) }}</strong>
              <small v-if="activity.notes">{{ activity.notes }}</small>
            </div>
            <time v-if="activity.activity_time">
              {{ formatActivityTime(activity.activity_time) }}
            </time>
          </div>
        </article>
      </div>
    </Transition>

    <div v-else class="section-empty-card">
      <i class="bi bi-calendar2-heart"></i>
      <div>
        <strong>No timeline added</strong>
        <span>This diary focuses on the story instead of day-by-day plans.</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-section {
  margin-top: 22px;
}

.detail-section h2 {
  color: var(--text-primary);
  font-size: 1.05rem;
  font-weight: 900;
  margin-bottom: 12px;
}

.timeline-day-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 14px;
  border-bottom: 1px solid #eadfca;
}

.timeline-day-tabs button {
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 900;
  position: relative;
  padding-bottom: 8px;
  cursor: pointer;
}

.timeline-day-tabs button.active {
  color: var(--accent);
}

.timeline-day-tabs button::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -11px;
  height: 3px;
  border-radius: 999px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.22s ease;
}

.timeline-day-tabs button.active::after {
  transform: scaleX(1);
}

.timeline-log {
  display: grid;
  gap: 0;
}

.timeline-slide-enter-active,
.timeline-slide-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.timeline-slide-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.timeline-slide-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}

.timeline-entry {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  padding-bottom: 16px;
}

.timeline-entry.last {
  padding-bottom: 0;
}

.timeline-rail {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
}

.timeline-rail::before {
  content: '';
  position: absolute;
  top: 50%;
  bottom: calc(-50% - 16px);
  border-left: 2px dashed rgba(var(--accent-rgb),0.35);
}

.timeline-entry.last .timeline-rail::before {
  display: none;
}

.timeline-dot {
  position: relative;
  z-index: 1;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 5px var(--accent-soft);
}

.timeline-dot.hollow {
  background: var(--surface);
  border: 2px solid var(--accent);
}

.timeline-card {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid #eadfca;
  border-radius: 18px;
  background: rgba(255,255,255,0.72);
  box-shadow: 0 10px 24px rgba(47,72,88,0.08);
}

.timeline-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent);
}

.timeline-icon svg {
  width: 18px;
  height: 18px;
}

.timeline-card strong,
.timeline-card small {
  display: block;
}

.timeline-card strong {
  color: var(--text-primary);
  font-weight: 900;
}

.timeline-card small,
.timeline-card time {
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.timeline-card time {
  font-weight: 800;
  white-space: nowrap;
}

.section-empty-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background: rgba(251, 249, 241, 0.72);
}

.section-empty-card i {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 1.2rem;
}

.section-empty-card strong,
.section-empty-card span {
  display: block;
}

.section-empty-card strong {
  color: var(--text-primary);
  font-weight: 900;
}

.section-empty-card span {
  color: var(--text-secondary);
  font-size: 0.86rem;
}

@media (max-width: 576px) {
  .timeline-card {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .timeline-card time {
    grid-column: 2;
  }
}
</style>

