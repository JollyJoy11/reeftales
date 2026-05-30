<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import draggable from 'vuedraggable'

import AppStampFrame from '@/components/common/AppStampFrame.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { getActivities } from '@/services/activityService'
import { getIslands } from '@/services/islandService'
import {
  createItinerary,
  deleteItinerary,
  getItineraries,
  getItineraryById,
  updateItinerary
} from '@/services/itineraryService'
import { getMarineWeather, getWeather } from '@/services/weatherService'
import { useToastStore } from '@/stores/toastStore'

const toastStore = useToastStore()

const loading = ref(true)
const saving = ref(false)
const weatherLoading = ref(false)
const activeItineraryId = ref(null)
const activeDay = ref(1)
const islands = ref([])
const activities = ref([])
const itineraries = ref([])
const weather = ref(null)
const marineWeather = ref(null)
const weatherUnavailable = ref('')

const form = ref(emptyTrip())

function emptyTrip() {
  return {
    title: 'Borneo Dive Expedition 2026',
    island_id: '',
    start_date: '',
    end_date: '',
    notes: '',
    items: [
      {
        local_id: crypto.randomUUID(),
        activity_id: '',
        title: 'Arrival and orientation',
        day_number: 1,
        start_time: '14:00',
        duration_minutes: 90,
        notes: 'Check in, rest, and equipment setup'
      }
    ],
    checklist: [
      { local_id: crypto.randomUUID(), label: 'Dive certification card', is_checked: true },
      { local_id: crypto.randomUUID(), label: 'Underwater camera', is_checked: false },
      { local_id: crypto.randomUUID(), label: 'Reef-safe sunscreen', is_checked: true },
      { local_id: crypto.randomUUID(), label: 'Journal and waterproof pen', is_checked: false }
    ],
    budget: [
      { local_id: crypto.randomUUID(), label: 'Flights', amount: 820 },
      { local_id: crypto.randomUUID(), label: 'Accommodation', amount: 1250 },
      { local_id: crypto.randomUUID(), label: 'Dive packages', amount: 1100 },
      { local_id: crypto.randomUUID(), label: 'Food and misc', amount: 360 }
    ]
  }
}

const selectedIsland = computed(() => {
  return islands.value.find(island => Number(island.id) === Number(form.value.island_id)) || null
})

const tripDays = computed(() => {
  if (!form.value.start_date || !form.value.end_date) return 1

  const start = new Date(form.value.start_date)
  const end = new Date(form.value.end_date)
  const days = Math.round((end - start) / 86400000) + 1

  return Number.isFinite(days) && days > 0 ? days : 1
})

const dayTabs = computed(() => {
  return Array.from({ length: tripDays.value }, (_, index) => index + 1)
})

const selectedDayItems = computed({
  get() {
    return form.value.items
      .filter(item => Number(item.day_number) === Number(activeDay.value))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  },
  set(items) {
    const otherItems = form.value.items.filter(item => Number(item.day_number) !== Number(activeDay.value))
    form.value.items = [
      ...otherItems,
      ...items.map((item, index) => ({
        ...item,
        day_number: activeDay.value,
        display_order: index
      }))
    ]
  }
})

const suggestedActivities = computed(() => {
  if (!selectedIsland.value?.activities) return activities.value.slice(0, 5)

  const availableNames = selectedIsland.value.activities
    .split(',')
    .map(item => item.trim().toLowerCase())

  return activities.value.filter(activity => availableNames.includes(activity.name.toLowerCase()))
})

const budgetTotal = computed(() => {
  return form.value.budget.reduce((sum, item) => sum + Number(item.amount || 0), 0)
})

const suitability = computed(() => {
  if (weatherUnavailable.value) {
    return {
      label: 'Seasonal guidance',
      tone: 'neutral',
      detail: selectedIsland.value?.best_visit_time
        ? `Forecast is unavailable. Best visit time: ${selectedIsland.value.best_visit_time}.`
        : 'Forecast is unavailable for those dates.'
    }
  }

  const rain = weather.value?.daily?.precipitation_probability_max || []
  const avgRain = rain.length
    ? rain.reduce((sum, value) => sum + Number(value || 0), 0) / rain.length
    : 0
  const wind = Number(weather.value?.current?.wind_speed_10m || 0)
  const wave = Number(marineWeather.value?.current?.wave_height || 0)

  if (!weather.value) {
    return {
      label: 'Select island and dates',
      tone: 'neutral',
      detail: 'Weather suitability appears after you choose a destination and trip dates.'
    }
  }

  if (avgRain <= 35 && wind <= 22 && wave <= 1.2) {
    return {
      label: 'Good time to go',
      tone: 'good',
      detail: `Low travel risk. Avg rain ${Math.round(avgRain)}%, wind ${wind || '-'} km/h, waves ${wave || '-'} m.`
    }
  }

  if (avgRain <= 60 && wind <= 34 && wave <= 2) {
    return {
      label: 'Plan with care',
      tone: 'okay',
      detail: `Some weather risk. Keep flexible indoor or light island activities ready.`
    }
  }

  return {
    label: 'Risky for marine plans',
    tone: 'risky',
    detail: 'Diving and snorkelling may be affected. Check operator advice before confirming.'
  }
})

const weatherDays = computed(() => {
  const daily = weather.value?.daily
  if (!daily?.time) return []

  return daily.time.map((date, index) => ({
    date,
    max: daily.temperature_2m_max?.[index],
    min: daily.temperature_2m_min?.[index],
    rain: daily.precipitation_probability_max?.[index]
  }))
})

function formatDate(date) {
  if (!date) return 'Select dates'

  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short'
  })
}

function tripDateLabel(trip) {
  if (!trip.start_date || !trip.end_date) return 'Dates not set'
  return `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`
}

function createLocalItem(data = {}) {
  return {
    local_id: crypto.randomUUID(),
    activity_id: data.activity_id || '',
    title: data.title || data.name || '',
    day_number: Number(data.day_number || activeDay.value),
    start_time: data.start_time || '09:00',
    duration_minutes: data.duration_minutes || 60,
    notes: data.notes || '',
    display_order: selectedDayItems.value.length
  }
}

function addSuggestedActivity(activity) {
  form.value.items.push(createLocalItem({
    activity_id: activity.id,
    title: activity.name,
    notes: activity.description || ''
  }))
}

function addBlankActivity() {
  form.value.items.push(createLocalItem({ title: 'New activity' }))
}

function removeActivity(localId) {
  form.value.items = form.value.items.filter(item => item.local_id !== localId)
}

function clampActivityDays() {
  form.value.items = form.value.items.map(item => ({
    ...item,
    day_number: Math.min(Math.max(Number(item.day_number || 1), 1), tripDays.value)
  }))

  if (activeDay.value > tripDays.value) {
    activeDay.value = tripDays.value
  }
}

function addChecklistItem() {
  form.value.checklist.push({
    local_id: crypto.randomUUID(),
    label: '',
    is_checked: false
  })
}

function addBudgetItem() {
  form.value.budget.push({
    local_id: crypto.randomUUID(),
    label: '',
    amount: 0
  })
}

function resetPlanner() {
  activeItineraryId.value = null
  activeDay.value = 1
  weather.value = null
  marineWeather.value = null
  weatherUnavailable.value = ''
  form.value = emptyTrip()
}

async function loadItinerary(id) {
  try {
    const trip = await getItineraryById(id)
    activeItineraryId.value = trip.id
    activeDay.value = 1
    form.value = {
      title: trip.title,
      island_id: trip.island_id,
      start_date: trip.start_date?.slice(0, 10) || '',
      end_date: trip.end_date?.slice(0, 10) || '',
      notes: trip.notes || '',
      items: trip.items.map(item => ({
        local_id: crypto.randomUUID(),
        activity_id: item.activity_id || '',
        title: item.title,
        day_number: item.day_number,
        start_time: item.start_time?.slice(0, 5) || '',
        duration_minutes: item.duration_minutes || 60,
        notes: item.notes || '',
        display_order: item.display_order || 0
      })),
      checklist: trip.checklist.map(item => ({
        local_id: crypto.randomUUID(),
        label: item.label,
        is_checked: Boolean(item.is_checked)
      })),
      budget: trip.budget.map(item => ({
        local_id: crypto.randomUUID(),
        label: item.label,
        amount: Number(item.amount || 0)
      }))
    }
  } catch {
    toastStore.danger('Unable to open itinerary.')
  }
}

function buildPayload() {
  return {
    title: form.value.title,
    island_id: form.value.island_id,
    start_date: form.value.start_date,
    end_date: form.value.end_date,
    notes: form.value.notes,
    items: form.value.items
      .filter(item => item.title?.trim())
      .map((item, index) => ({
        activity_id: item.activity_id || null,
        title: item.title,
        day_number: Number(item.day_number || 1),
        start_time: item.start_time || null,
        duration_minutes: Number(item.duration_minutes || 0) || null,
        notes: item.notes || null,
        display_order: item.display_order ?? index
      })),
    checklist: form.value.checklist
      .filter(item => item.label?.trim())
      .map((item, index) => ({
        label: item.label,
        is_checked: item.is_checked,
        display_order: index
      })),
    budget: form.value.budget
      .filter(item => item.label?.trim())
      .map((item, index) => ({
        label: item.label,
        amount: Number(item.amount || 0),
        display_order: index
      }))
  }
}

async function savePlanner() {
  try {
    saving.value = true
    const payload = buildPayload()

    if (activeItineraryId.value) {
      await updateItinerary(activeItineraryId.value, payload)
      toastStore.success('Itinerary updated.')
    } else {
      const response = await createItinerary(payload)
      activeItineraryId.value = response.itineraryId
      toastStore.success('Itinerary saved.')
    }

    itineraries.value = await getItineraries()
  } catch (error) {
    toastStore.danger(error.response?.data?.message || 'Unable to save itinerary.')
  } finally {
    saving.value = false
  }
}

async function removeTrip(id) {
  try {
    await deleteItinerary(id)
    itineraries.value = await getItineraries()

    if (activeItineraryId.value === id) {
      resetPlanner()
    }

    toastStore.success('Itinerary deleted.')
  } catch {
    toastStore.danger('Unable to delete itinerary.')
  }
}

async function loadWeather() {
  if (!selectedIsland.value?.latitude || !form.value.start_date || !form.value.end_date) return

  try {
    weatherLoading.value = true
    weatherUnavailable.value = ''

    const [weatherData, marineData] = await Promise.all([
      getWeather(selectedIsland.value.latitude, selectedIsland.value.longitude, {
        startDate: form.value.start_date,
        endDate: form.value.end_date
      }),
      getMarineWeather(
        selectedIsland.value.marine_latitude || selectedIsland.value.latitude,
        selectedIsland.value.marine_longitude || selectedIsland.value.longitude
      )
    ])

    weather.value = weatherData
    marineWeather.value = marineData
  } catch {
    weather.value = null
    marineWeather.value = null
    weatherUnavailable.value = 'Forecast is not available for those selected dates.'
  } finally {
    weatherLoading.value = false
  }
}

async function loadInitialData() {
  try {
    loading.value = true
    const [islandData, activityData, itineraryData] = await Promise.all([
      getIslands(),
      getActivities(),
      getItineraries()
    ])

    islands.value = islandData
    activities.value = activityData
    itineraries.value = itineraryData
  } catch {
    toastStore.danger('Unable to load trip planner.')
  } finally {
    loading.value = false
  }
}

watch(
  () => [form.value.start_date, form.value.end_date],
  () => clampActivityDays()
)

watch(
  () => [form.value.island_id, form.value.start_date, form.value.end_date],
  () => loadWeather()
)

onMounted(loadInitialData)
</script>

<template>
  <MainLayout>
    <main class="planner-page">
      <LoadingState v-if="loading" message="Loading trip planner..." />

      <div v-else class="planner-shell">
        <section class="planner-hero">
          <div>
            <span>Trip Planner</span>
            <h1>Plan your island days before they become journals.</h1>
            <p>
              Check weather, build a draggable timeline, and turn popular island activities into a practical plan.
            </p>
          </div>

          <button type="button" class="new-trip-btn" @click="resetPlanner">
            <i class="bi bi-plus-circle"></i>
            New trip
          </button>
        </section>

        <section class="trip-ticket-grid">
          <article
            v-for="trip in itineraries"
            :key="trip.id"
            class="trip-ticket"
            :class="{ active: activeItineraryId === trip.id }"
          >
            <AppStampFrame
              class="ticket-stamp"
              :image="trip.island_cover_image || '/images/island-placeholder.jpg'"
              alt="Trip island"
              :contain="false"
            />

            <div class="ticket-body">
              <span>{{ tripDateLabel(trip) }}</span>
              <h2>{{ trip.title }}</h2>
              <p>{{ trip.island_name || 'Island not set' }} · {{ trip.item_count || 0 }} activities</p>
            </div>

            <div class="ticket-price">
              <strong>RM {{ Number(trip.budget_total || 0).toLocaleString() }}</strong>
              <button type="button" @click="loadItinerary(trip.id)">Open</button>
              <button type="button" class="delete-ticket" @click="removeTrip(trip.id)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </article>
        </section>

        <section class="planner-workspace">
          <div class="planner-left">
            <section class="paper-panel trip-setup">
              <div class="panel-title">
                <span>Current trip</span>
                <button type="button" :disabled="saving" @click="savePlanner">
                  <i class="bi bi-save"></i>
                  {{ saving ? 'Saving...' : 'Save itinerary' }}
                </button>
              </div>

              <div class="setup-grid">
                <label>
                  Trip title
                  <input v-model="form.title" type="text" />
                </label>

                <label>
                  Island
                  <select v-model="form.island_id">
                    <option value="">Choose island</option>
                    <option v-for="island in islands" :key="island.id" :value="island.id">
                      {{ island.name }}, {{ island.country }}
                    </option>
                  </select>
                </label>

                <label>
                  Start date
                  <input v-model="form.start_date" type="date" />
                </label>

                <label>
                  End date
                  <input v-model="form.end_date" type="date" :min="form.start_date" />
                </label>

                <label class="setup-note">
                  Trip notes
                  <textarea
                    v-model="form.notes"
                    rows="3"
                    placeholder="Permits, meeting points, operator reminders, or anything you want to remember before the trip"
                  ></textarea>
                </label>
              </div>

              <div class="map-weather-row">
                <div class="mini-map">
                  <span class="map-marker"><i class="bi bi-geo-alt-fill"></i></span>
                  <strong>{{ selectedIsland?.name || 'Select an island' }}</strong>
                  <small v-if="selectedIsland">
                    {{ selectedIsland.latitude }}, {{ selectedIsland.longitude }}
                  </small>
                </div>

                <div class="weather-score" :class="suitability.tone">
                  <small>{{ weatherLoading ? 'Checking weather...' : 'Weather suitability' }}</small>
                  <strong>{{ suitability.label }}</strong>
                  <p>{{ suitability.detail }}</p>
                </div>
              </div>
            </section>

            <section class="paper-panel timeline-panel">
              <div class="panel-title">
                <span>Day timeline</span>
                <button type="button" @click="addBlankActivity">
                  <i class="bi bi-plus-circle"></i>
                  Add activity
                </button>
              </div>

              <div class="day-tabs">
                <button
                  v-for="day in dayTabs"
                  :key="day"
                  type="button"
                  :class="{ active: activeDay === day }"
                  @click="activeDay = day"
                >
                  Day {{ day }}
                </button>
              </div>

              <draggable
                v-model="selectedDayItems"
                item-key="local_id"
                handle=".drag-handle"
                class="timeline-list"
              >
                <template #item="{ element, index }">
                  <article class="timeline-item">
                    <button type="button" class="drag-handle" aria-label="Drag activity">
                      <i class="bi bi-grip-vertical"></i>
                    </button>

                    <span class="timeline-dot">{{ index + 1 }}</span>

                    <div class="timeline-fields">
                      <div class="activity-line">
                        <input v-model="element.start_time" type="time" />
                        <input
                          v-model="element.day_number"
                          type="number"
                          min="1"
                          :max="tripDays"
                          title="Day number"
                        />
                        <input v-model="element.title" type="text" placeholder="Activity title" />
                        <input v-model="element.duration_minutes" type="number" min="0" step="15" />
                      </div>

                      <textarea v-model="element.notes" rows="2" placeholder="Notes for this activity"></textarea>
                    </div>

                    <button type="button" class="remove-btn" @click="removeActivity(element.local_id)">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </article>
                </template>
              </draggable>

              <div v-if="!selectedDayItems.length" class="empty-timeline">
                Drop activities into this day or add one manually.
              </div>
            </section>
          </div>

          <aside class="planner-side">
            <section class="paper-panel suggestions-panel">
              <div class="panel-title">
                <span>Popular here</span>
              </div>

              <div class="suggestion-list">
                <button
                  v-for="activity in suggestedActivities"
                  :key="activity.id"
                  type="button"
                  @click="addSuggestedActivity(activity)"
                >
                  <i class="bi bi-plus-circle"></i>
                  {{ activity.name }}
                </button>
              </div>
            </section>

            <section class="paper-panel weather-panel">
              <div class="panel-title">
                <span>Selected dates</span>
              </div>

              <div v-if="weatherDays.length" class="weather-days">
                <div v-for="day in weatherDays" :key="day.date" class="weather-day">
                  <strong>{{ formatDate(day.date) }}</strong>
                  <span>{{ Math.round(day.min) }}° - {{ Math.round(day.max) }}°</span>
                  <small>{{ day.rain ?? '-' }}% rain</small>
                </div>
              </div>

              <p v-else class="side-empty">
                Select an island and dates to show the forecast.
              </p>
            </section>

            <section class="paper-panel checklist-panel">
              <div class="panel-title">
                <span>Packing checklist</span>
                <button type="button" @click="addChecklistItem">
                  <i class="bi bi-plus"></i>
                </button>
              </div>

              <label v-for="item in form.checklist" :key="item.local_id" class="check-item">
                <input v-model="item.is_checked" type="checkbox" />
                <input v-model="item.label" type="text" placeholder="Checklist item" />
              </label>
            </section>

            <section class="paper-panel budget-panel">
              <div class="panel-title">
                <span>Budget notes</span>
                <button type="button" @click="addBudgetItem">
                  <i class="bi bi-plus"></i>
                </button>
              </div>

              <div v-for="item in form.budget" :key="item.local_id" class="budget-row">
                <input v-model="item.label" type="text" placeholder="Budget item" />
                <input v-model="item.amount" type="number" min="0" step="10" />
              </div>

              <strong class="budget-total">Total RM {{ budgetTotal.toLocaleString() }}</strong>
            </section>
          </aside>
        </section>
      </div>
    </main>
  </MainLayout>
</template>

<style scoped>
.planner-page {
  min-height: calc(100vh - 80px);
  padding: 34px 0 64px;
  background:
    radial-gradient(circle at top left, rgba(169,216,214,0.38), transparent 32%),
    linear-gradient(180deg, #fffdf8 0%, #f6ecdc 100%);
}

.planner-shell {
  width: min(1220px, calc(100% - 32px));
  margin: 0 auto;
}

.planner-hero,
.paper-panel,
.trip-ticket {
  position: relative;
  border: 1px dashed #d8cdbb;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255,253,248,0.96), rgba(251,247,239,0.96)),
    repeating-linear-gradient(0deg, transparent 0 31px, rgba(216,205,187,0.36) 32px);
  box-shadow: 0 16px 34px rgba(47,72,88,0.09);
}

.planner-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  padding: 30px;
}

.planner-hero::before,
.paper-panel::before {
  content: '';
  position: absolute;
  top: -12px;
  right: 42px;
  width: 86px;
  height: 24px;
  background: rgba(235,116,82,0.34);
  border-left: 1px dashed rgba(47,72,88,0.14);
  border-right: 1px dashed rgba(47,72,88,0.14);
  transform: rotate(3deg);
}

.planner-hero span,
.panel-title span {
  color: #1897a0;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.planner-hero h1 {
  max-width: 720px;
  margin: 6px 0;
  font-weight: 900;
}

.planner-hero p,
.side-empty,
.weather-score p {
  margin: 0;
  color: #64748b;
}

.new-trip-btn,
.panel-title button,
.trip-ticket button:not(.delete-ticket) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #1897a0;
  border-radius: 999px;
  background: #1897a0;
  color: #fff;
  font-weight: 800;
  box-shadow: 0 10px 20px rgba(24,151,160,0.18);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.new-trip-btn {
  padding: 12px 18px;
}

.panel-title button,
.trip-ticket button:not(.delete-ticket) {
  padding: 7px 12px;
  font-size: 0.82rem;
}

.new-trip-btn:hover,
.panel-title button:hover,
.trip-ticket button:not(.delete-ticket):hover,
.new-trip-btn:focus-visible,
.panel-title button:focus-visible,
.trip-ticket button:not(.delete-ticket):focus-visible {
  background: #147d84;
  color: #fff;
  transform: translateY(-2px);
  box-shadow:
    0 14px 26px rgba(24,151,160,0.24),
    0 0 0 4px rgba(24,151,160,0.12);
}

.new-trip-btn:active,
.panel-title button:active,
.trip-ticket button:not(.delete-ticket):active {
  transform: translateY(0);
  box-shadow: 0 8px 16px rgba(24,151,160,0.18);
}

.trip-ticket-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 18px 0;
}

.trip-ticket {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 14px;
  overflow: hidden;
}

.trip-ticket::after {
  content: '';
  position: absolute;
  top: 18px;
  right: 18px;
  width: 30px;
  height: 70px;
  background: repeating-linear-gradient(90deg, #bd704e 0 3px, transparent 3px 6px);
  opacity: 0.45;
}

.trip-ticket.active {
  border-color: #1897a0;
  box-shadow: 0 0 0 4px rgba(24,151,160,0.1);
}

.ticket-stamp {
  aspect-ratio: 1;
  --stamp-radius: 5px;
  --stamp-size: 15px;
}

.ticket-body span,
.ticket-body p {
  color: #64748b;
}

.ticket-body h2 {
  margin: 4px 0;
  color: #2f4858;
  font-size: 1.2rem;
}

.ticket-price {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: end;
  gap: 8px;
}

.ticket-price strong {
  color: #bd704e;
}

.delete-ticket {
  width: 34px;
  height: 34px;
  padding: 0 !important;
  border-color: #e07a6f !important;
  background: #fff1ed !important;
  color: #c24135 !important;
}

.planner-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
  align-items: start;
}

.planner-left,
.planner-side {
  display: grid;
  gap: 18px;
}

.paper-panel {
  padding: 22px;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.setup-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.setup-note {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 7px;
  color: #2f4858;
  font-weight: 900;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #d8cdbb;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fffdf8;
  color: #1f2937;
  font: inherit;
  box-shadow: none;
}

textarea {
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #1897a0;
  box-shadow: 0 0 0 3px rgba(24,151,160,0.12);
}

.map-weather-row {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 14px;
  margin-top: 16px;
}

.mini-map,
.weather-score {
  min-height: 130px;
  display: grid;
  align-content: center;
  gap: 6px;
  border-radius: 16px;
  padding: 18px;
  border: 1px solid rgba(216,205,187,0.85);
}

.mini-map {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 35%, rgba(24,151,160,0.32), transparent 9%),
    radial-gradient(circle at 70% 62%, rgba(235,116,82,0.24), transparent 10%),
    linear-gradient(135deg, #cce8e7 0%, #f7efe2 100%);
}

.mini-map::before {
  content: '';
  position: absolute;
  inset: 18px;
  border: 2px dashed rgba(47,72,88,0.2);
  border-radius: 48% 52% 42% 58%;
}

.map-marker {
  position: relative;
  z-index: 1;
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fffdf8;
  color: #1897a0;
  box-shadow: 0 8px 18px rgba(47,72,88,0.15);
}

.mini-map strong,
.mini-map small {
  position: relative;
  z-index: 1;
}

.weather-score.good {
  background: rgba(222,239,236,0.82);
  border-color: rgba(24,151,160,0.24);
}

.weather-score.okay {
  background: rgba(255,243,205,0.78);
  border-color: rgba(212,160,23,0.24);
}

.weather-score.risky {
  background: rgba(255,241,237,0.86);
  border-color: rgba(224,122,111,0.26);
}

.weather-score.neutral {
  background: rgba(255,253,248,0.82);
}

.weather-score strong {
  color: #2f4858;
  font-size: 1.08rem;
}

.day-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  margin-bottom: 16px;
  border-bottom: 1px solid #d8cdbb;
}

.day-tabs button {
  border: none;
  border-bottom: 3px solid transparent;
  padding: 8px 4px 10px;
  background: transparent;
  color: #486174;
  font-weight: 900;
  white-space: nowrap;
}

.day-tabs button.active {
  border-color: #1897a0;
  color: #1897a0;
}

.timeline-list {
  display: grid;
  gap: 12px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 34px 42px minmax(0, 1fr) 34px;
  gap: 12px;
  align-items: start;
  padding: 14px;
  border: 1px solid rgba(216,205,187,0.85);
  border-radius: 16px;
  background: #fffdf8;
}

.drag-handle,
.remove-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: #f4eadc;
  color: #7c6f63;
}

.drag-handle {
  cursor: grab;
}

.timeline-dot {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #deefec;
  color: #1897a0;
  font-weight: 900;
}

.timeline-fields {
  display: grid;
  gap: 9px;
}

.activity-line {
  display: grid;
  grid-template-columns: 110px 72px minmax(0, 1fr) 90px;
  gap: 9px;
}

.empty-timeline {
  padding: 18px;
  border: 1px dashed #d8cdbb;
  border-radius: 14px;
  color: #64748b;
}

.suggestion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.suggestion-list button {
  border: 1px solid rgba(24,151,160,0.28);
  border-radius: 999px;
  padding: 8px 12px;
  background: #deefec;
  color: #147d84;
  font-weight: 800;
}

.weather-days {
  display: grid;
  gap: 9px;
}

.weather-day {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 10px;
  padding-bottom: 9px;
  border-bottom: 1px dashed #d8cdbb;
}

.weather-day small {
  grid-column: 1 / -1;
  color: #64748b;
}

.check-item {
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  margin-bottom: 8px;
}

.check-item input[type='checkbox'] {
  width: 16px;
  height: 16px;
  padding: 0;
  accent-color: #1897a0;
}

.budget-row {
  display: grid;
  gap: 8px;
  margin-bottom: 8px;
}

.budget-row {
  grid-template-columns: minmax(0, 1fr) 110px;
}

.budget-total {
  display: block;
  padding-top: 10px;
  border-top: 1px dashed #d8cdbb;
  color: #2f4858;
  text-align: right;
}

@media (max-width: 1050px) {
  .planner-workspace {
    grid-template-columns: 1fr;
  }

  .planner-side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .planner-shell {
    width: min(100% - 20px, 1220px);
  }

  .planner-hero,
  .trip-ticket,
  .setup-grid,
  .map-weather-row,
  .planner-side,
  .trip-ticket-grid,
  .activity-line {
    grid-template-columns: 1fr;
  }

  .planner-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .trip-ticket {
    justify-items: stretch;
  }

  .ticket-price {
    justify-items: start;
  }

  .timeline-item {
    grid-template-columns: 34px minmax(0, 1fr) 34px;
  }

  .timeline-dot {
    display: none;
  }
}

:global(body.dark-mode) .planner-page {
  background:
    radial-gradient(circle at top left, rgba(38,210,222,0.14), transparent 32%),
    linear-gradient(180deg, #1a202c 0%, #202938 100%);
}

:global(body.dark-mode) .planner-hero,
:global(body.dark-mode) .paper-panel,
:global(body.dark-mode) .trip-ticket,
:global(body.dark-mode) .timeline-item,
:global(body.dark-mode) .mini-map,
:global(body.dark-mode) .weather-score {
  background: #253244;
  border-color: rgba(255,255,255,0.13);
  color: #f8fafc;
}

:global(body.dark-mode) input,
:global(body.dark-mode) select,
:global(body.dark-mode) textarea {
  background: #2d3748;
  border-color: rgba(255,255,255,0.14);
  color: #f8fafc;
}

:global(body.dark-mode) .planner-hero p,
:global(body.dark-mode) .ticket-body span,
:global(body.dark-mode) .ticket-body p,
:global(body.dark-mode) .weather-score p,
:global(body.dark-mode) .side-empty,
:global(body.dark-mode) .weather-day small,
:global(body.dark-mode) .empty-timeline {
  color: #cbd5e1;
}

:global(body.dark-mode) .planner-hero h1,
:global(body.dark-mode) .ticket-body h2,
:global(body.dark-mode) label,
:global(body.dark-mode) .weather-score strong,
:global(body.dark-mode) .budget-total {
  color: #f8fafc;
}
</style>
