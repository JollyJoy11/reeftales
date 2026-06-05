<script setup>
import { useI18n } from 'vue-i18n'
import AppStampFrame from '@/components/common/AppStampFrame.vue'

const { t } = useI18n()

defineProps({
  trips: { type: Array, default: () => [] },
  savedIslands: { type: Array, default: () => [] },
  savedJournals: { type: Array, default: () => [] },
  activeId: { type: [Number, String], default: null }
})

const emit = defineEmits([
  'open',
  'delete',
  'new',
  'select-island',
  'use-journal'
])

function formatDate(date) {
  if (!date) return t('planner.dateNotSet')
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short'
  })
}

function tripDateLabel(trip) {
  if (!trip.start_date) return t('planner.dateNotSet')

  const start = formatDate(trip.start_date)
  const end = formatDate(trip.end_date)

  if (!trip.end_date || start === end) {
    return start
  }

  return `${start} - ${end}`
}
</script>

<template>
  <aside class="planned-trip-sidebar">
    <div class="sidebar-header">
      <div>
        <h3>{{ t('planner.tripLibrary') }}</h3>
      </div>

      <button
        type="button"
        class="new-trip-icon-btn"
        :aria-label="t('planner.createNewTrip')"
        @click="emit('new')"
      >
        <i class="bi bi-plus-circle"></i>
      </button>
    </div>

    <div class="sidebar-content">
      <section class="sidebar-section">
        <h4>{{ t('dashboard.savedIslands') }}</h4>

        <div v-if="savedIslands.length" class="saved-island-list">
          <button
            v-for="island in savedIslands"
            :key="island.id"
            type="button"
            class="saved-island-pill"
            @click="emit('select-island', island)"
          >
            <img
              :src="island.cover_image || '/images/island-placeholder.jpg'"
              :alt="`${island.name} cover`"
            />
            <span>{{ island.name }}</span>
          </button>
        </div>

        <p v-else class="sidebar-empty">{{ t('dashboard.noSavedIslands') }}</p>
      </section>

      <section class="sidebar-section">
        <h4>{{ t('planner.savedJournalTemplates') }}</h4>

        <div v-if="savedJournals.length" class="saved-journal-list">
          <button
            v-for="journal in savedJournals"
            :key="journal.id"
            type="button"
            class="saved-journal-card"
            @click="emit('use-journal', journal)"
          >
            <div>
              <small>{{ t('planner.useAsTemplate') }}</small>
              <strong>{{ journal.title }}</strong>
              <span>{{ journal.island_name || t('planner.islandJournal') }}</span>
            </div>

            <i class="bi bi-arrow-right-circle"></i>
          </button>
        </div>

        <p v-else class="sidebar-empty">{{ t('dashboard.noSavedJournals') }}</p>
      </section>

      <section class="sidebar-section">
        <h4>{{ t('planner.yourTrips') }}</h4>

        <div v-if="trips.length" class="trip-list">
          <article
            v-for="trip in trips"
            :key="trip.id"
            class="mini-ticket"
            :class="{ active: Number(activeId) === Number(trip.id) }"
          >
            <button type="button" class="ticket-main" @click="emit('open', trip.id)">
              <AppStampFrame
                class="ticket-stamp"
                :image="trip.island_cover_image || '/images/island-placeholder.jpg'"
                :alt="`${trip.island_name || trip.title || t('planner.trip')} cover`"
                :contain="false"
              />

              <div class="ticket-copy">
                <small>{{ tripDateLabel(trip) }}</small>
                <strong>{{ trip.title }}</strong>
                <span>{{ trip.island_name || t('planner.islandNotSet') }}</span>
                <em>
                  {{ t('planner.activitiesBudget', { count: trip.item_count || 0, total: Number(trip.budget_total || 0).toLocaleString() }) }}
                </em>
              </div>
            </button>

            <button type="button" class="delete-trip" @click="emit('delete', trip.id)">
              <i class="bi bi-trash"></i>
            </button>
          </article>
        </div>

        <div v-else class="empty-trips">
          <i class="bi bi-map"></i>
          <strong>{{ t('planner.noPlannedTrips') }}</strong>
          <span>{{ t('planner.createFirstTrip') }}</span>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.planned-trip-sidebar {
  position: sticky;
  top: calc(var(--navbar-h) + 16px);
  max-height: calc(100vh - var(--navbar-h) - 32px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border: 1px dashed var(--border);
  border-radius: 24px;
  background: var(--surface-soft);
  box-shadow: 0 16px 34px rgba(47,72,88,0.08);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
}

.sidebar-section h4 {
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-header h3 {
  margin: 2px 0 0;
  color: var(--text-primary);
  font-weight: 900;
}

.new-trip-icon-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: white;
  box-shadow: 0 10px 22px rgba(var(--accent-rgb),0.22);
  transition: 0.18s ease;
}

.new-trip-icon-btn:hover {
  background: var(--accent-strong);
  transform: translateY(-2px);
  box-shadow:
    0 14px 26px rgba(var(--accent-rgb),0.24),
    0 0 0 4px rgba(var(--accent-rgb),0.12);
}

.sidebar-section {
  display: grid;
  gap: 10px;
  padding: 14px 0;
  border-top: 1px dashed var(--border);
}

.sidebar-section h4 {
  margin: 0;
}

.saved-island-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.saved-island-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #eadfca;
  border-radius: 999px;
  padding: 6px 10px 6px 6px;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 0.78rem;
  font-weight: 900;
  transition: 0.18s ease;
}

.saved-island-pill:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  background: var(--accent-soft);
}

.saved-island-pill img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.saved-journal-list,
.trip-list {
  display: grid;
  gap: 10px;
}

.saved-journal-card {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px dashed var(--border);
  border-radius: 14px;
  padding: 11px 12px;
  background: var(--surface);
  text-align: left;
  transition: 0.18s ease;
}

.saved-journal-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  background: var(--surface-soft);
  box-shadow: 0 8px 18px rgba(47,72,88,0.08);
}

.saved-journal-card small,
.saved-journal-card strong,
.saved-journal-card span {
  display: block;
}

.saved-journal-card small {
  color: var(--accent);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.saved-journal-card strong {
  color: var(--text-primary);
  font-size: 0.82rem;
}

.saved-journal-card span {
  color: var(--text-secondary);
  font-size: 0.74rem;
}

.saved-journal-card i {
  color: var(--accent);
}

.mini-ticket {
  position: relative;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background: var(--surface);
  transition: 0.18s ease;
}

.mini-ticket:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 10px 22px rgba(47,72,88,0.08);
}

.mini-ticket.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(var(--accent-rgb),0.1);
}

.ticket-main {
  width: 100%;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  border: none;
  background: transparent;
  padding: 12px;
  text-align: left;
}

.ticket-stamp {
  width: 72px;
  height: 72px;
  --stamp-radius: 4px;
  --stamp-size: 12px;
}

.ticket-copy small,
.ticket-copy span,
.ticket-copy em {
  display: block;
}

.ticket-copy small {
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 900;
}

.ticket-copy strong {
  display: block;
  color: var(--text-primary);
  line-height: 1.25;
}

.ticket-copy span,
.ticket-copy em,
.sidebar-empty {
  color: var(--text-secondary);
  font-size: 0.76rem;
}

.ticket-copy em {
  margin-top: 4px;
  font-style: normal;
  font-weight: 800;
}

.delete-trip {
  position: absolute;
  right: 8px;
  bottom: 8px;
  border: none;
  background: transparent;
  color: #94a3b8;
  transition: 0.18s ease;
}

.delete-trip:hover {
  color: #dc3545;
  transform: scale(1.08);
}

.empty-trips {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 22px 14px;
  border: 1px dashed var(--border);
  border-radius: 18px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-trips i {
  color: var(--accent);
  font-size: 1.6rem;
}

.empty-trips strong {
  color: var(--text-primary);
}

.sidebar-content::-webkit-scrollbar {
  width: 8px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #c4a484;
  border-radius: 999px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

@media (max-width: 991px) {
  .planned-trip-sidebar {
    position: static;
    max-height: none;
    overflow: visible;
  }
}
</style>

