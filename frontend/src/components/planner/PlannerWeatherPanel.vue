<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  weather: {
    type: Object,
    default: null
  },
  marine: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  unavailable: {
    type: String,
    default: ''
  },
  suitability: {
    type: Object,
    default: null
  }
})

const days = computed(() => {
  const daily = props.weather?.daily
  if (!daily?.time) return []

  return daily.time.map((date, index) => {
    const rain = Number(daily.precipitation_probability_max?.[index] ?? 0)
    const max = daily.temperature_2m_max?.[index]
    const min = daily.temperature_2m_min?.[index]
    const code = daily.weather_code?.[index]

    return {
      date,
      max,
      min,
      rain,
      code,
      icon: getWeatherIcon(code, rain),
      tone: getDayTone(rain),
      label: getDayLabel(rain)
    }
  })
})

const marineSummary = computed(() => {
  const wave = Number(props.marine?.current?.wave_height ?? 0)
  const current = Number(props.marine?.current?.ocean_current_velocity ?? 0)

  if (!props.marine) {
    return {
      tone: 'neutral',
      label: t('planner.seaUnavailable'),
      detail: t('planner.waveCurrentHint')
    }
  }

  if (wave <= 1.2 && current <= 1.5) {
    return {
      tone: 'good',
      label: t('planner.calmSea'),
      detail: t('planner.seaDetail', { wave: wave || '-', current: current || '-' })
    }
  }

  if (wave <= 2 && current <= 2.5) {
    return {
      tone: 'okay',
      label: t('planner.moderateSea'),
      detail: t('planner.seaDetail', { wave: wave || '-', current: current || '-' })
    }
  }

  return {
    tone: 'risky',
    label: t('planner.roughSea'),
    detail: t('planner.seaDetail', { wave: wave || '-', current: current || '-' })
  }
})

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short'
  })
}

function getWeatherIcon(code, rain) {
  if (rain >= 70) return 'bi bi-cloud-rain-heavy'
  if (rain >= 45) return 'bi bi-cloud-drizzle'

  if (code === 0) return 'bi bi-sun'
  if ([1, 2, 3].includes(code)) return 'bi bi-cloud-sun'
  if ([45, 48].includes(code)) return 'bi bi-cloud-fog'
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'bi bi-cloud-rain'
  if ([95, 96, 99].includes(code)) return 'bi bi-cloud-lightning-rain'

  return 'bi bi-cloud-sun'
}

function getDayTone(rain) {
  if (rain >= 70) return 'risky'
  if (rain >= 45) return 'okay'
  return 'good'
}

function getDayLabel(rain) {
  if (rain >= 70) return t('planner.risky')
  if (rain >= 45) return t('planner.caution')
  return t('planner.good')
}

</script>

<template>
  <section class="planner-weather-card">
    <div class="weather-heading">
      <span>{{ t('planner.tripWeather') }}</span>

      <strong>
        {{ loading ? t('planner.checkingForecast') : suitability?.label || t('planner.selectIslandDates') }}
      </strong>

      <p>
        {{ unavailable || suitability?.detail || t('planner.weatherSuitabilityHint') }}
      </p>
    </div>

    <div v-if="days.length" class="weather-day-list">
      <article
        v-for="(day, index) in days"
        :key="day.date"
        class="weather-day-card"
        :class="day.tone"
      >
        <div class="day-icon">
          <i :class="day.icon"></i>
        </div>

        <div>
          <strong>{{ t('planner.day', { day: index + 1 }) }}</strong>
          <span>{{ formatDate(day.date) }}</span>
        </div>

        <div class="day-weather-info">
          <strong>{{ Math.round(day.max) }}°</strong>
          <small>{{ t('planner.rainChance', { rain: day.rain }) }}</small>
        </div>

        <em>{{ day.label }}</em>
      </article>
    </div>

    <div v-else-if="!loading" class="weather-empty">
      <i class="bi bi-cloud-sun"></i>
      <span>{{ t('planner.chooseIslandDatesWeather') }}</span>
    </div>

    <div v-if="marine" class="sea-summary" :class="marineSummary.tone">
      <div class="sea-icon">
        <i class="bi bi-water"></i>
      </div>

      <div>
        <span>{{ t('planner.seaConditions') }}</span>
        <strong>{{ marineSummary.label }}</strong>
        <p>{{ marineSummary.detail }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.planner-weather-card {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 16px;
  border: 1px dashed var(--border);
  border-radius: 20px;
  background: var(--surface);
}

.weather-heading {
  min-width: 0;
}

.weather-heading span {
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.weather-heading strong {
  display: block;
  margin-top: 4px;
  color: var(--text-primary);
  font-size: 1.05rem;
}

.weather-heading p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.45;
}

.weather-day-list {
  display: grid;
  gap: 8px;
}

.weather-day-card {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.weather-day-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.weather-day-card.good {
  background: var(--accent-soft);
  border-color: rgba(var(--accent-rgb),0.22);
}

.weather-day-card.okay {
  background: #fff7db;
  border-color: rgba(217,119,6,0.22);
}

.weather-day-card.risky {
  background: #fee2e2;
  border-color: rgba(220,38,38,0.2);
}

.day-icon,
.sea-icon {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.62);
  color: var(--accent);
  font-size: 1.1rem;
}

.weather-day-card strong,
.weather-day-card span,
.weather-day-card small,
.weather-day-card em {
  display: block;
  overflow-wrap: anywhere;
}

.weather-day-card strong {
  color: var(--text-primary);
  font-size: 0.84rem;
}

.weather-day-card span,
.weather-day-card small {
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.day-weather-info {
  text-align: right;
  min-width: max-content;
}

.weather-day-card em {
  justify-self: end;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.65);
  color: var(--text-primary);
  font-size: 0.68rem;
  font-style: normal;
  font-weight: 900;
}

.weather-empty {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.weather-empty i {
  color: var(--accent);
  font-size: 1.2rem;
}

.sea-summary {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 12px;
  border-radius: 16px;
}

.sea-summary > div {
  min-width: 0;
}

.sea-summary.good {
  background: var(--accent-soft);
}

.sea-summary.okay {
  background: #fff7db;
}

.sea-summary.risky {
  background: #fee2e2;
}

.sea-summary.neutral {
  background: var(--surface-soft);
}

.sea-summary span,
.sea-summary strong,
.sea-summary p {
  display: block;
}

.sea-summary span {
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
}

.sea-summary strong {
  color: var(--text-primary);
}

.sea-summary p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.76rem;
  overflow-wrap: anywhere;
}
</style>
