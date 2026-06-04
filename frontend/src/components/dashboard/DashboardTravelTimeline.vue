<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import AppStampFrame from '@/components/common/AppStampFrame.vue'

const props = defineProps({
  entries: {
    type: Array,
    default: () => []
  },
  actionIds: {
    type: Object,
    default: () => new Set()
  }
})

const emit = defineEmits(['toggle-visibility', 'remove-journal', 'remove-itinerary'])

const completedCount = computed(() =>
  props.entries.filter(entry => entry.type === 'completed').length
)

const plannedCount = computed(() =>
  props.entries.filter(entry => entry.type === 'planned').length
)

const readyCount = computed(() =>
  props.entries.filter(entry => entry.type === 'ready').length
)

function coverFor(item) {
  return item.cover_image || item.island_cover_image || '/images/island-placeholder.jpg'
}

function dateParts(entry) {
  const [month = 'Trip', year = ''] = String(entry.monthLabel || 'Trip').split(' ')
  return { month, year }
}

function startJournalQuery(entry) {
  return {
    path: '/journal/create',
    query: {
      island_id: entry.island_id,
      start_date: entry.start_date,
      end_date: entry.end_date || entry.start_date,
      title: `${entry.island_name || entry.title} journal`
    }
  }
}

function planRoute(entry) {
  return {
    path: '/planner',
    query: {
      trip: entry.id
    }
  }
}

function isActionLoading(entry) {
  return props.actionIds?.has?.(entry.key) || false
}
</script>

<template>
  <section class="travel-timeline">
    <div class="timeline-summary">
      <div>
        <strong>{{ entries.length }}</strong>
        <span>Total entries</span>
      </div>

      <div>
        <strong>{{ completedCount }}</strong>
        <span>Journals</span>
      </div>

      <div>
        <strong>{{ plannedCount }}</strong>
        <span>Planned</span>
      </div>

      <div>
        <strong>{{ readyCount }}</strong>
        <span>Ready</span>
      </div>
    </div>

    <div class="timeline-log">
      <article
        v-for="(entry, index) in entries"
        :key="entry.key"
        class="timeline-entry"
        :class="[
          `is-${entry.type}`,
          { last: index === entries.length - 1 }
        ]"
      >
        <div class="timeline-date">
          <span>{{ dateParts(entry).month }}</span>
          <small>{{ dateParts(entry).year }}</small>
        </div>

        <div class="timeline-rail">
          <span class="timeline-dot" :class="{ hollow: entry.type !== 'completed' }">
            <i
              :class="{
                'bi bi-check-lg': entry.type === 'completed',
                'bi bi-pencil': entry.type === 'ready',
                'bi bi-calendar-heart': entry.type === 'planned'
              }"
            ></i>
          </span>
        </div>

        <article class="timeline-card">
          <div class="timeline-card-header">
            <span class="timeline-icon">
              <i
                :class="{
                  'bi bi-journal-check': entry.type === 'completed',
                  'bi bi-pencil-square': entry.type === 'ready',
                  'bi bi-calendar-heart': entry.type === 'planned'
                }"
              ></i>
            </span>

            <div class="timeline-title-row">
              <div>
                <strong>{{ entry.island_name || entry.title }}</strong>
                <small>{{ entry.country || 'Malaysia' }} &middot; {{ entry.days || 1 }} day{{ entry.days === 1 ? '' : 's' }}</small>
              </div>

              <span class="timeline-status">
                {{ entry.statusLabel }}
              </span>
            </div>
          </div>

          <div class="timeline-body">
            <div class="timeline-main">
              <p>{{ entry.content || entry.title || 'No notes added yet.' }}</p>

              <div class="meta-pills">
                <span v-if="entry.type === 'completed'">
                  <i class="bi bi-water"></i>
                  {{ entry.sighting_count || 0 }} species
                </span>

                <span v-else>
                  <i class="bi bi-pin-map"></i>
                  {{ entry.item_count || 0 }} planned stops
                </span>

                <span v-if="entry.type === 'completed'">
                  <i :class="entry.visibility === 'public' ? 'bi bi-eye' : 'bi bi-lock'"></i>
                  {{ entry.visibility === 'public' ? 'Public story' : 'Private story' }}
                </span>
              </div>
            </div>

            <AppStampFrame
              class="timeline-stamp"
              :image="coverFor(entry)"
              :alt="entry.title || entry.island_name || 'Timeline image'"
              @error="$event.target.src = '/images/island-placeholder.jpg'"
            />
          </div>

          <div v-if="entry.type === 'completed'" class="timeline-controls">
            <RouterLink :to="`/journal/${entry.id}`" class="open-btn">
              View journal
            </RouterLink>

            <button
              type="button"
              class="visibility-toggle"
              :class="{ private: entry.visibility === 'private' }"
              :disabled="isActionLoading(entry)"
              @click.stop="emit('toggle-visibility', entry)"
            >
              <i :class="entry.visibility === 'public' ? 'bi bi-eye' : 'bi bi-lock'"></i>
              {{ entry.visibility === 'public' ? 'Public' : 'Private' }}
            </button>

            <button
              type="button"
              class="delete-journal-btn"
              :disabled="isActionLoading(entry)"
              aria-label="Delete journal"
              @click.stop="emit('remove-journal', entry)"
            >
              <i class="bi bi-trash3"></i>
            </button>
          </div>

          <div v-else class="timeline-controls">
            <RouterLink
              v-if="entry.type === 'ready'"
              :to="startJournalQuery(entry)"
              class="open-btn"
            >
              Start journal
            </RouterLink>

            <RouterLink :to="planRoute(entry)" class="open-btn secondary">
              View plan
            </RouterLink>

            <button
              type="button"
              class="delete-journal-btn"
              :disabled="isActionLoading(entry)"
              aria-label="Delete itinerary"
              @click.stop="emit('remove-itinerary', entry)"
            >
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </article>
      </article>
    </div>
  </section>
</template>

<style scoped>
.travel-timeline {
  display: grid;
  gap: 18px;
}

.timeline-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.timeline-summary div {
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.timeline-summary strong {
  color: var(--text-primary);
  font-size: 1.35rem;
  line-height: 1;
}

.timeline-summary span {
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 900;
}

.timeline-log {
  display: grid;
  gap: 0;
}

.timeline-entry {
  display: grid;
  grid-template-columns: 58px 30px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  padding-bottom: 18px;
}

.timeline-entry.last {
  padding-bottom: 0;
}

.timeline-date {
  display: grid;
  justify-items: end;
  align-content: start;
  padding-top: 18px;
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 900;
  line-height: 1.1;
}

.timeline-date small {
  color: var(--text-muted);
}

.timeline-rail {
  position: relative;
  display: flex;
  justify-content: center;
  padding-top: 24px;
}

.timeline-rail::before {
  content: '';
  position: absolute;
  top: 42px;
  bottom: -18px;
  border-left: 2px dashed var(--border-strong);
}

.timeline-entry.last .timeline-rail::before {
  display: none;
}

.timeline-dot {
  position: relative;
  z-index: 1;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 0.72rem;
  box-shadow: 0 0 0 6px var(--accent-soft);
}

.timeline-dot.hollow {
  background: var(--surface);
  border: 2px solid var(--accent);
  color: var(--accent);
}

.timeline-card {
  position: relative;
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 12px 26px rgba(47, 72, 88, 0.08);
  overflow: hidden;
}

.timeline-entry.is-planned .timeline-card {
  border-style: dashed;
}

.timeline-entry.is-ready .timeline-card {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent-soft) 18%, var(--surface) 82%);
}

.timeline-card-header,
.timeline-body {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.timeline-body {
  grid-template-columns: minmax(0, 1fr) 92px;
  align-items: center;
}

.timeline-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
}

.timeline-entry.is-ready .timeline-icon,
.timeline-entry.is-ready .timeline-dot {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.timeline-entry.is-ready .timeline-dot {
  border-color: var(--accent-strong);
  box-shadow: 0 0 0 6px var(--accent-soft);
}

.timeline-title-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.timeline-title-row strong,
.timeline-title-row small {
  display: block;
}

.timeline-title-row strong {
  color: var(--text-primary);
  font-weight: 900;
}

.timeline-title-row small {
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.timeline-status {
  flex: 0 0 auto;
  height: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
}

.timeline-entry.is-ready .timeline-status {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.timeline-entry.is-planned .timeline-status {
  background: var(--surface-soft);
  color: var(--accent-strong);
}

.timeline-main {
  min-width: 0;
}

.timeline-card p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-secondary);
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.timeline-stamp {
  width: 92px;
  aspect-ratio: 0.86;
  transform: rotate(2deg);
  --stamp-radius: 5px;
  --stamp-size: 12px;
}

.meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.meta-pills span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 800;
}

.timeline-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.open-btn,
.visibility-toggle,
.delete-journal-btn {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 999px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 900;
  text-decoration: none;
}

.open-btn {
  gap: 8px;
  padding: 8px 14px;
  background: var(--accent);
  color: #fff;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.open-btn.secondary {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.open-btn:hover,
.open-btn:focus-visible {
  background: var(--accent-strong);
  color: #fff;
}

.open-btn.secondary:hover,
.open-btn.secondary:focus-visible {
  background: var(--surface);
  color: var(--accent-strong);
}

.timeline-single-action {
  justify-self: end;
}

.visibility-toggle {
  gap: 6px;
  padding: 7px 11px;
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.visibility-toggle.private {
  background: var(--surface-soft);
  color: var(--accent-strong);
}

.delete-journal-btn {
  width: 34px;
  background: var(--surface-soft);
  color: var(--accent-strong);
}

.visibility-toggle:hover,
.delete-journal-btn:hover,
.visibility-toggle:focus-visible,
.delete-journal-btn:focus-visible {
  border-color: currentColor;
}

.visibility-toggle:disabled,
.delete-journal-btn:disabled {
  cursor: wait;
  opacity: 0.58;
}

@media (max-width: 1100px) {
  .timeline-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .timeline-controls,
  .timeline-single-action {
    justify-self: start;
  }
}

@media (max-width: 640px) {
  .timeline-entry {
    grid-template-columns: 44px 24px minmax(0, 1fr);
    gap: 8px;
  }

  .timeline-date {
    font-size: 0.68rem;
  }

  .timeline-dot {
    width: 24px;
    height: 24px;
    box-shadow: 0 0 0 5px var(--accent-soft);
  }

  .timeline-card {
    padding: 14px;
  }

  .timeline-card-header,
  .timeline-body {
    grid-template-columns: 1fr;
  }

  .timeline-icon {
    display: none;
  }

  .timeline-title-row {
    display: grid;
  }

  .timeline-stamp {
    width: 84px;
  }

  .timeline-controls {
    justify-content: flex-start;
  }

  .timeline-status {
    width: fit-content;
  }
}
</style>

