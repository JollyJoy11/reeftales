<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'

import AppStampFrame from '@/components/common/AppStampFrame.vue'
import AppTimePicker from '@/components/common/AppTimePicker.vue'
import AppDateRangePicker from '@/components/common/AppDateRangePicker.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import PlannedTripSidebar from '@/components/planner/PlannedTripSidebar.vue'
import PlannerWeatherPanel from '@/components/planner/PlannerWeatherPanel.vue'
import PlannerActivitySuitability from '@/components/planner/PlannerActivitySuitability.vue'

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
import { getSavedIslands } from '@/services/savedIslandService'
import { getSavedJournals } from '@/services/savedJournalService'
import { getJournalById } from '@/services/journalService'

const toastStore = useToastStore()
const route = useRoute()
const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const weatherLoading = ref(false)
const activeItineraryId = ref(null)
const activeDay = ref(1)
const activeTab = ref('details')

const islands = ref([])
const activities = ref([])
const itineraries = ref([])
const weather = ref(null)
const marineWeather = ref(null)
const weatherUnavailable = ref('')
const savedIslands = ref([])
const savedJournals = ref([])

const form = ref(emptyTrip())

function emptyTrip() {
  return {
    title: t('planner.untitledTrip'),
    island_id: '',
    start_date: '',
    end_date: '',
    notes: '',
    items: [
      {
        local_id: crypto.randomUUID(),
        activity_id: '',
        title: t('planner.defaultActivityTitle'),
        day_number: 1,
        start_time: '14:00',
        duration_minutes: 90,
        notes: t('planner.defaultActivityNotes'),
        display_order: 0
      }
    ],
    checklist: [
      { local_id: crypto.randomUUID(), label: t('planner.sunscreen'), is_checked: false },
      { local_id: crypto.randomUUID(), label: t('planner.swimwear'), is_checked: false },
      { local_id: crypto.randomUUID(), label: t('planner.waterproofBag'), is_checked: false },
      { local_id: crypto.randomUUID(), label: t('planner.travelJournal'), is_checked: false }
    ],
    budget: [
      { local_id: crypto.randomUUID(), label: t('planner.boatTransfer'), amount: 0 },
      { local_id: crypto.randomUUID(), label: t('planner.islandStay'), amount: 0 },
      { local_id: crypto.randomUUID(), label: t('planner.meals'), amount: 0 }
    ]
  }
}

const selectedIsland = computed(() => {
  return islands.value.find(island => Number(island.id) === Number(form.value.island_id)) || null
})

const dateRange = computed({
  get() {
    return [form.value.start_date, form.value.end_date].filter(Boolean)
  },
  set(value) {
    form.value.start_date = value?.[0] || ''
    form.value.end_date = value?.[1] || ''
  }
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
  if (!selectedIsland.value?.activities) return activities.value.slice(0, 6)

  const availableNames = selectedIsland.value.activities
    .split(',')
    .map(item => item.trim().toLowerCase())

  return activities.value
    .filter(activity => availableNames.includes(activity.name.toLowerCase()))
    .slice(0, 6)
})

const budgetTotal = computed(() => {
  return form.value.budget.reduce((sum, item) => sum + Number(item.amount || 0), 0)
})

const currentJournalRoute = computed(() => {
  return buildJournalRoute({
    island_id: form.value.island_id,
    start_date: form.value.start_date,
    end_date: form.value.end_date,
    title: form.value.title
  })
})

const canPrefillCurrentJournal = computed(() => {
  return Boolean(form.value.island_id)
})

const suitability = computed(() => {
  if (weatherUnavailable.value) {
    return {
      label: t('planner.seasonalGuidance'),
      tone: 'neutral',
      detail: selectedIsland.value?.best_visit_time
        ? t('planner.bestVisitTime', { time: selectedIsland.value.best_visit_time })
        : t('planner.forecastUnavailableDates')
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
      label: t('planner.selectIslandDates'),
      tone: 'neutral',
      detail: t('planner.weatherSuitabilityHint')
    }
  }

  if (avgRain <= 35 && wind <= 22 && wave <= 1.2) {
    return {
      label: t('planner.goodTime'),
      tone: 'good',
      detail: t('planner.lowTravelRisk', { rain: Math.round(avgRain), wind: wind || '-', wave: wave || '-' })
    }
  }

  if (avgRain <= 60 && wind <= 34 && wave <= 2) {
    return {
      label: t('planner.planWithCare'),
      tone: 'okay',
      detail: t('planner.someWeatherRisk')
    }
  }

  return {
    label: t('planner.riskyMarinePlans'),
    tone: 'risky',
    detail: t('planner.divingAffected')
  }
})

function normalizeDateForQuery(date) {
  if (!date) return ''
  return String(date).slice(0, 10)
}

function buildJournalRoute(source) {
  const query = {}

  if (source.island_id) query.island_id = source.island_id
  if (source.start_date) query.start_date = normalizeDateForQuery(source.start_date)
  if (source.end_date || source.start_date) query.end_date = normalizeDateForQuery(source.end_date || source.start_date)
  if (source.title) query.title = source.title

  return {
    path: '/journal/create',
    query
  }
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
  form.value.items.push(createLocalItem({ title: t('planner.newActivity') }))
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

function removeChecklistItem(localId) {
  form.value.checklist = form.value.checklist.filter(item => item.local_id !== localId)
}

function addBudgetItem() {
  form.value.budget.push({
    local_id: crypto.randomUUID(),
    label: '',
    amount: 0
  })
}

function removeBudgetItem(localId) {
  form.value.budget = form.value.budget.filter(item => item.local_id !== localId)
}

function resetPlanner() {
  activeItineraryId.value = null
  activeDay.value = 1
  activeTab.value = 'details'
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
    activeTab.value = 'details'

    form.value = {
      title: trip.title,
      island_id: trip.island_id,
      start_date: trip.start_date?.slice(0, 10) || '',
      end_date: trip.end_date?.slice(0, 10) || '',
      notes: trip.notes || '',
      items: (trip.items || []).map(item => ({
        local_id: crypto.randomUUID(),
        activity_id: item.activity_id || '',
        title: item.title || item.activity_name || item.custom_activity_name || '',
        day_number: item.day_number || 1,
        start_time: item.start_time?.slice(0, 5) || '',
        duration_minutes: item.duration_minutes || 60,
        notes: item.notes || '',
        display_order: item.display_order || 0
      })),
      checklist: (trip.checklist || []).map(item => ({
        local_id: crypto.randomUUID(),
        label: item.label,
        is_checked: Boolean(item.is_checked)
      })),
      budget: (trip.budget || []).map(item => ({
        local_id: crypto.randomUUID(),
        label: item.label,
        amount: Number(item.amount || 0)
      }))
    }

    if (!form.value.items.length) {
      form.value.items = emptyTrip().items
    }

    if (!form.value.checklist.length) {
      form.value.checklist = emptyTrip().checklist
    }

    if (!form.value.budget.length) {
      form.value.budget = emptyTrip().budget
    }
  } catch {
    toastStore.danger(t('planner.openError'))
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
        custom_activity_name: item.activity_id ? null : item.title,
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
      toastStore.success(t('planner.itineraryUpdated'))
    } else {
      const response = await createItinerary(payload)
      activeItineraryId.value = response.itineraryId
      toastStore.success(t('planner.itinerarySaved'))
    }

    itineraries.value = await getItineraries()
  } catch (error) {
    toastStore.danger(error.response?.data?.message || t('planner.saveError'))
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

    toastStore.success(t('planner.itineraryDeleted'))
  } catch {
    toastStore.danger(t('planner.deleteError'))
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
    weatherUnavailable.value = t('planner.forecastUnavailableDates')
  } finally {
    weatherLoading.value = false
  }
}

async function loadInitialData() {
  try {
    loading.value = true

    const [islandData, activityData, itineraryData, savedIslandData, savedJournalData] = await Promise.all([
      getIslands(),
      getActivities(),
      getItineraries(),
      getSavedIslands(),
      getSavedJournals()
    ])

    islands.value = islandData
    activities.value = activityData
    itineraries.value = itineraryData
    savedIslands.value = savedIslandData
    savedJournals.value = savedJournalData
  } catch {
    toastStore.danger(t('planner.loadError'))
  } finally {
    loading.value = false
  }
}

function useSavedIsland(island) {
  form.value.island_id = island.id
  activeTab.value = 'details'
}

async function useSavedJournalTemplate(journal) {
  try {
    const fullJournal = await getJournalById(journal.id)

    const start = new Date()
    start.setDate(start.getDate() + 1)

    const journalStart = fullJournal.start_date
      ? new Date(fullJournal.start_date)
      : null

    const journalEnd = fullJournal.end_date
      ? new Date(fullJournal.end_date)
      : journalStart

    const journalDays = journalStart && journalEnd
      ? Math.max(1, Math.round((journalEnd - journalStart) / 86400000) + 1)
      : 1

    const end = new Date(start)
    end.setDate(start.getDate() + journalDays - 1)

    form.value.title = t('planner.tripInspiredBy', { title: fullJournal.title })
    form.value.island_id = fullJournal.island_id
    form.value.start_date = start.toISOString().slice(0, 10)
    form.value.end_date = end.toISOString().slice(0, 10)
    form.value.notes = fullJournal.content || ''

    form.value.items = (fullJournal.activities || []).map((activity, index) => ({
      local_id: crypto.randomUUID(),
      activity_id: activity.activity_id || '',
      title: activity.activity_name || activity.custom_activity_name || t('planner.plannedActivity'),
      day_number: Number(activity.day_number || 1),
      start_time: activity.activity_time?.slice(0, 5) || activity.start_time?.slice(0, 5) || '09:00',
      duration_minutes: activity.duration_minutes || 60,
      notes: activity.notes || '',
      display_order: activity.display_order ?? index
    }))

    if (!form.value.items.length) {
      form.value.items = emptyTrip().items
    }

    activeDay.value = 1

    toastStore.success(t('planner.templateApplied'))
  } catch {
    toastStore.danger(t('planner.templateError'))
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

onMounted(async () => {
  await loadInitialData()

  if (route.query.trip) {
    await loadItinerary(route.query.trip)
  }
})
</script>

<template>
  <MainLayout>
    <main class="planner-page">
      <LoadingState v-if="loading" :message="t('planner.loading')" />

      <div v-else class="planner-shell">
        <section class="planner-hero">
          <div>
            <span>{{ t('planner.eyebrow') }}</span>
            <h1>{{ t('planner.title') }}</h1>
            <p>
              {{ t('planner.intro') }}
            </p>
          </div>
        </section>

        <section class="planner-layout">
          <PlannedTripSidebar
            :trips="itineraries"
            :saved-islands="savedIslands"
            :saved-journals="savedJournals"
            :active-id="activeItineraryId"
            @new="resetPlanner"
            @open="loadItinerary"
            @delete="removeTrip"
            @select-island="useSavedIsland"
            @use-journal="useSavedJournalTemplate"
          />

          <div class="planner-main">
            <section class="paper-panel trip-current-panel">
              <div class="panel-title">
                <div>
                  <span>{{ t('planner.currentTrip') }}</span>
                  <h2>{{ form.title || t('planner.untitledTrip') }}</h2>
                </div>

                <div class="panel-actions">
                  <RouterLink
                    v-if="canPrefillCurrentJournal"
                    :to="currentJournalRoute"
                    class="ghost-btn"
                  >
                    <i class="bi bi-journal-plus"></i>
                    {{ t('planner.createJournal') }}
                  </RouterLink>

                  <button type="button" :disabled="saving" class="primary-btn" @click="savePlanner">
                    <i class="bi bi-save"></i>
                    {{ saving ? t('common.saving') : t('planner.saveItinerary') }}
                  </button>
                </div>
              </div>

              <div class="planner-tabs">
                <button type="button" :class="{ active: activeTab === 'details' }" @click="activeTab = 'details'">
                  {{ t('planner.details') }}
                </button>
                <button type="button" :class="{ active: activeTab === 'timeline' }" @click="activeTab = 'timeline'">
                  {{ t('planner.timeline') }}
                </button>
                <button type="button" :class="{ active: activeTab === 'packing' }" @click="activeTab = 'packing'">
                  {{ t('planner.packing') }}
                </button>
                <button type="button" :class="{ active: activeTab === 'budget' }" @click="activeTab = 'budget'">
                  {{ t('planner.budget') }}
                </button>
              </div>

              <div v-if="activeTab === 'details'" class="tab-content-area">
                <div class="details-grid">
                  <div class="setup-fields">
                    <label>
                      {{ t('planner.tripTitle') }}
                      <input v-model="form.title" type="text" :placeholder="t('planner.tripTitlePlaceholder')" />
                    </label>

                    <label>
                      {{ t('planner.island') }}
                      <select v-model="form.island_id">
                        <option value="">{{ t('planner.chooseIsland') }}</option>
                        <option v-for="island in islands" :key="island.id" :value="island.id">
                          {{ island.name }}, {{ island.country }}
                        </option>
                      </select>
                    </label>

                    <AppDateRangePicker
                      v-model="dateRange"
                      :label="t('planner.tripDates')"
                    />

                    <label>
                      {{ t('planner.tripNotes') }}
                      <textarea
                        v-model="form.notes"
                        rows="4"
                        :placeholder="t('planner.tripNotesPlaceholder')"
                      ></textarea>
                    </label>

                    <PlannerActivitySuitability
                      :weather="weather"
                      :marine="marineWeather"
                    />
                  </div>

                  <div class="destination-sidebar">
                    <div class="trip-preview-card">
                      <AppStampFrame
                        class="trip-preview-stamp"
                        :image="selectedIsland?.cover_image || '/images/island-placeholder.jpg'"
                        :alt="`${selectedIsland?.name || t('planner.selectedIsland')} cover`"
                        :contain="false"
                      />

                      <div>
                        <span>{{ t('planner.destination') }}</span>
                        <strong>{{ selectedIsland?.name || t('planner.noIslandSelected') }}</strong>
                        <p v-if="selectedIsland">
                          {{ selectedIsland.location || selectedIsland.country }}
                        </p>
                        <p v-else>
                          {{ t('planner.chooseIslandPreview') }}
                        </p>
                      </div>
                    </div>

                    <PlannerWeatherPanel
                      :weather="weather"
                      :marine="marineWeather"
                      :loading="weatherLoading"
                      :unavailable="weatherUnavailable"
                      :suitability="suitability"
                    />
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'timeline'" class="tab-content-area">
                <div class="timeline-header">
                  <div>
                    <h3>{{ t('planner.dayTimeline') }}</h3>
                    <p>{{ t('planner.timelineHint') }}</p>
                  </div>

                  <button type="button" class="primary-btn" @click="addBlankActivity">
                    <i class="bi bi-plus-circle"></i>
                    {{ t('planner.addActivity') }}
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
                    {{ t('planner.day', { day }) }}
                  </button>
                </div>

                <div v-if="suggestedActivities.length" class="suggestion-strip">
                  <span>{{ t('planner.popularHere') }}</span>

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

                <draggable
                  v-model="selectedDayItems"
                  item-key="local_id"
                  handle=".drag-handle"
                  ghost-class="timeline-ghost"
                  chosen-class="timeline-chosen"
                  drag-class="timeline-active"
                  class="timeline-list"
                >
                  <template #item="{ element, index }">
                    <article class="timeline-item">
                      <button type="button" class="drag-handle" :aria-label="t('planner.dragActivity')">
                        <i class="bi bi-grip-vertical"></i>
                      </button>

                      <span class="timeline-dot">{{ index + 1 }}</span>

                      <div class="timeline-fields">
                        <div class="activity-line">
                          <AppTimePicker v-model="element.start_time" />

                          <input
                            v-model="element.title"
                            type="text"
                            :placeholder="t('planner.activityTitle')"
                          />

                          <input
                            v-model="element.duration_minutes"
                            type="number"
                            min="0"
                            step="15"
                            :placeholder="t('planner.minutes')"
                          />
                        </div>

                        <textarea
                          v-model="element.notes"
                          rows="2"
                          :placeholder="t('planner.activityNotes')"
                        ></textarea>
                      </div>

                      <button type="button" class="remove-btn" @click="removeActivity(element.local_id)">
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </article>
                  </template>
                </draggable>

                <div v-if="!selectedDayItems.length" class="empty-timeline">
                  {{ t('planner.noActivitiesDay', { day: activeDay }) }}
                </div>
              </div>

              <div v-if="activeTab === 'packing'" class="tab-content-area">
                <div class="panel-subtitle">
                  <h3>{{ t('planner.packingChecklist') }}</h3>
                  <button type="button" class="ghost-btn" @click="addChecklistItem">
                    <i class="bi bi-plus"></i>
                    {{ t('planner.addItem') }}
                  </button>
                </div>

                <div class="checklist-grid">
                  <label v-for="item in form.checklist" :key="item.local_id" class="check-item">
                    <input v-model="item.is_checked" type="checkbox" />
                    <input v-model="item.label" type="text" :placeholder="t('planner.checklistItem')" />

                    <button type="button" class="tiny-remove-btn" @click="removeChecklistItem(item.local_id)">
                      <i class="bi bi-x"></i>
                    </button>
                  </label>
                </div>
              </div>

              <div v-if="activeTab === 'budget'" class="tab-content-area">
                <div class="panel-subtitle">
                  <h3>{{ t('planner.budgetNotes') }}</h3>
                  <button type="button" class="ghost-btn" @click="addBudgetItem">
                    <i class="bi bi-plus"></i>
                    {{ t('planner.addBudget') }}
                  </button>
                </div>

                <div class="budget-list">
                  <div v-for="item in form.budget" :key="item.local_id" class="budget-row">
                    <input v-model="item.label" type="text" :placeholder="t('planner.budgetItem')" />
                    <input v-model="item.amount" type="number" min="0" step="10" />

                    <button type="button" class="tiny-remove-btn" @click="removeBudgetItem(item.local_id)">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>

                <strong class="budget-total">
                  {{ t('planner.estimatedTotal', { total: budgetTotal.toLocaleString() }) }}
                </strong>
              </div>
            </section>
          </div>
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
    radial-gradient(circle at top left, rgba(169,216,214,0.35), transparent 32%),
    linear-gradient(180deg, var(--surface-soft) 0%, var(--page-bg) 100%);
}

.planner-shell {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
}

.planner-hero,
.paper-panel {
  position: relative;
  border: 1px dashed var(--border);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(169,216,214,0.18), transparent 34%),
    var(--surface);
  box-shadow: 0 16px 34px rgba(47,72,88,0.09);
}

.planner-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 30px;
  margin-bottom: 20px;
}

.paper-panel::before {
  content: '';
  position: absolute;
  top: -11px;
  right: 46px;
  width: 86px;
  height: 23px;
  background: rgba(169,216,214,0.55);
  border-left: 1px dashed rgba(47,72,88,0.12);
  border-right: 1px dashed rgba(47,72,88,0.12);
  transform: rotate(3deg);
}

.planner-hero span,
.panel-title span {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.planner-hero h1 {
  max-width: 720px;
  margin: 6px 0;
  color: var(--text-primary);
  font-weight: 900;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 1.05;
}

.planner-hero p {
  max-width: 720px;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.planner-layout {
  display: grid;
  grid-template-columns: 330px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.planner-main {
  min-width: 0;
}

.paper-panel {
  padding: 24px;
}

.panel-title,
.panel-subtitle,
.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-title h2,
.panel-subtitle h3,
.timeline-header h3 {
  margin: 3px 0 0;
  color: var(--text-primary);
  font-weight: 900;
}

.destination-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-header p {
  margin: 4px 0 0;
  color: var(--text-secondary);
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.primary-btn,
.ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 0.84rem;
  font-weight: 900;
  text-decoration: none;
  transition: 0.18s ease;
}

.primary-btn {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: white;
  box-shadow: 0 10px 20px rgba(24,151,160,0.18);
}

.ghost-btn {
  border: 1px solid var(--accent);
  background: var(--surface);
  color: var(--accent);
}

.primary-btn:hover,
.ghost-btn:hover {
  transform: translateY(-2px);
}

.planner-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--border);
}

.planner-tabs button {
  border: none;
  border-radius: 999px;
  padding: 9px 15px;
  background: var(--surface);
  color: var(--text-secondary);
  font-weight: 900;
}

.planner-tabs button.active {
  background: var(--accent-soft);
  color: var(--accent);
}

.tab-content-area {
  padding-top: 18px;
}

.details-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
  margin-bottom: 18px;
}

.setup-fields {
  display: grid;
  gap: 14px;
}

.timeline-chosen {
  border-color: var(--accent) !important;
  background: var(--accent-soft) !important;
}

.timeline-active {
  opacity: 0.85;
  transform: rotate(0.5deg);
}

.timeline-ghost {
  opacity: 0.35;
  border: 2px dashed var(--accent) !important;
}

label {
  display: grid;
  gap: 7px;
  color: var(--text-primary);
  font-weight: 900;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--surface);
  color: var(--text-primary);
  font: inherit;
}

textarea {
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(24,151,160,0.12);
}

.trip-preview-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px dashed var(--border);
  border-radius: 20px;
  background: var(--surface);
}

.trip-preview-stamp {
  width: 100%;
  aspect-ratio: 1.5;
  --stamp-radius: 5px;
  --stamp-size: 15px;
}

.trip-preview-card span {
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.trip-preview-card strong {
  display: block;
  color: var(--text-primary);
  font-size: 1.2rem;
}

.trip-preview-card p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 0.86rem;
}

.day-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.day-tabs button {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 8px 14px;
  background: var(--surface);
  color: var(--text-secondary);
  font-weight: 900;
  white-space: nowrap;
}

.day-tabs button.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.suggestion-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 16px;
  background: var(--surface-soft);
}

.suggestion-strip span {
  color: #7c6f63;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
}

.suggestion-strip button {
  border: 1px solid rgba(24,151,160,0.28);
  border-radius: 999px;
  padding: 7px 11px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 800;
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
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
}

.drag-handle,
.remove-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--text-secondary);
}

.drag-handle {
  cursor: grab;
}

.drag-handle:hover {
  background: var(--surface);
  color: var(--text-primary);
}

.drag-handle:active {
  cursor: grabbing;
}

.timeline-chosen .drag-handle,
.timeline-active .drag-handle {
  background: rgba(24,151,160,0.16);
  color: var(--accent);
}

.timeline-dot {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(24,151,160,0.2);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 900;
}

.timeline-fields {
  display: grid;
  gap: 9px;
}

.activity-line {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) 110px;
  gap: 9px;
}

.empty-timeline {
  padding: 18px;
  border: 1px dashed var(--border);
  border-radius: 16px;
  color: var(--text-secondary);
  background: var(--surface-soft);
}

.checklist-grid {
  display: grid;
  gap: 10px;
}

.check-item {
  grid-template-columns: 20px minmax(0, 1fr) 32px;
  align-items: center;
  padding: 10px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.check-item input[type='checkbox'] {
  width: 16px;
  height: 16px;
  padding: 0;
  accent-color: var(--accent);
}

.budget-list {
  display: grid;
  gap: 10px;
}

.budget-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px 32px;
  gap: 10px;
}

.tiny-remove-btn {
  border: none;
  border-radius: 50%;
  background: var(--surface-soft);
  color: #dc3545;
}

.budget-total {
  display: block;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
  color: var(--text-primary);
  text-align: right;
}

@media (max-width: 991px) {
  .planner-layout,
  .details-grid {
    grid-template-columns: 1fr;
  }

  .planner-hero {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 760px) {
  .planner-shell {
    width: min(100% - 20px, 1240px);
  }

  .panel-title,
  .panel-subtitle,
  .timeline-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .panel-actions {
    justify-content: flex-start;
  }

  .timeline-item {
    grid-template-columns: 34px minmax(0, 1fr) 34px;
  }

  .timeline-dot {
    display: none;
  }

  .activity-line,
  .budget-row,
  .check-item {
    grid-template-columns: 1fr;
  }
}
</style>
