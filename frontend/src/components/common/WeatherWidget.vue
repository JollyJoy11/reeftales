<script setup>
const props = defineProps({
  weather: {
    type: Object,
    default: null
  },
  marine: {
    type: Object,
    default: null
  }
})

function getWeatherLabel(code) {
  if (code === 0) return 'Clear sky'
  if ([1, 2, 3].includes(code)) return 'Partly cloudy'
  if ([45, 48].includes(code)) return 'Foggy'
  if ([51, 53, 55, 61, 63, 65].includes(code)) return 'Rainy'
  if ([80, 81, 82].includes(code)) return 'Showers'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Weather update'
}

function formatDay(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short'
  })
}

function getVisitOutlook() {
  if (!props.weather) return null

  const rain = props.weather.daily?.precipitation_probability_max?.[0] ?? 0
  const wind = props.weather.current?.wind_speed_10m ?? 0
  const wave = props.marine?.current?.wave_height ?? 0

  if (rain >= 70 || wind >= 35 || wave >= 2) {
    return {
      type: 'danger',
      label: 'Not ideal today',
      icon: 'bi bi-exclamation-triangle',
      message: 'Rain, wind, or waves may affect outdoor sea activities.'
    }
  }

  if (rain >= 45 || wind >= 25 || wave >= 1.2) {
    return {
      type: 'warning',
      label: 'Plan with caution',
      icon: 'bi bi-info-circle',
      message: 'Conditions are acceptable, but check again before water activities.'
    }
  }

  return {
    type: 'good',
    label: 'Good for visiting',
    icon: 'bi bi-check-circle',
    message: 'Weather and sea conditions look suitable for light island activities.'
  }
}

function getWaveLabel(height) {
  if (height >= 2) return 'Rough'
  if (height >= 1.2) return 'Moderate'
  return 'Calm'
}

function formatValue(value, suffix) {
  if (value === undefined || value === null) return '—'
  return `${value} ${suffix}`
}
</script>

<template>
  <section class="weather-card">
    <div
      v-if="getVisitOutlook()"
      class="visit-outlook"
      :class="getVisitOutlook().type"
    >
      <i :class="getVisitOutlook().icon"></i>

      <div>
        <strong>{{ getVisitOutlook().label }}</strong>
        <span>{{ getVisitOutlook().message }}</span>
      </div>
    </div>

    <div v-if="weather">
      <div class="weather-current">
        <div class="weather-icon">
          <i class="bi bi-cloud-sun"></i>
        </div>

        <div>
          <span class="weather-label">Current Weather</span>
          <strong>{{ weather.current.temperature_2m }}°C</strong>
          <p>{{ getWeatherLabel(weather.current.weather_code) }}</p>
          <small>Wind {{ weather.current.wind_speed_10m }} km/h</small>
        </div>
      </div>

      <div class="forecast-row">
        <div
          v-for="(day, index) in weather.daily.time"
          :key="day"
          class="forecast-item"
        >
          <span>{{ formatDay(day) }}</span>

          <strong>
            {{ weather.daily.temperature_2m_max[index] }}° /
            {{ weather.daily.temperature_2m_min[index] }}°
          </strong>

          <small>
            Rain {{ weather.daily.precipitation_probability_max[index] }}%
          </small>
        </div>
      </div>
    </div>

    <div v-else class="weather-empty">
      <i class="bi bi-cloud-slash"></i>
      <strong>Weather unavailable</strong>
      <span>Unable to load forecast</span>
    </div>

    <div v-if="marine" class="marine-section">
      <div class="marine-title">
        <i class="bi bi-water"></i>
        <span>Sea Conditions</span>
      </div>

      <div class="marine-grid">
        <div class="marine-item">
          <i class="bi bi-tsunami"></i>
          <span>Wave Height</span>
          <strong>{{ formatValue(marine.current.wave_height, 'm') }}</strong>
          <small>{{ getWaveLabel(marine.current.wave_height) }}</small>
        </div>

        <div class="marine-item">
          <i class="bi bi-hourglass-split"></i>
          <span>Wave Period</span>
          <strong>{{ formatValue(marine.current.wave_period, 's') }}</strong>
          <small>Wave interval</small>
        </div>

        <div class="marine-item">
          <i class="bi bi-compass"></i>
          <span>Current</span>
          <strong>{{ formatValue(marine.current.ocean_current_velocity, 'm/s') }}</strong>
          <small>Sea movement</small>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.weather-card {
  margin-top: 14px;
  padding: 14px;
  border-radius: 18px;
  background: #fffdf8;
  border: 1px solid #eadfca;
}

.visit-outlook {
  margin-bottom: 14px;
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  color: #2f4858;
}

.visit-outlook.good {
  background: #deefec;
}

.visit-outlook.warning {
  background: #fff7db;
}

.visit-outlook.danger {
  background: #fee2e2;
}

.visit-outlook i {
  color: #1897a0;
  font-size: 1.2rem;
}

.visit-outlook.warning i {
  color: #d97706;
}

.visit-outlook.danger i {
  color: #dc2626;
}

.visit-outlook span {
  display: block;
  font-size: 0.78rem;
  color: #64748b;
}

.weather-current {
  display: flex;
  gap: 12px;
  align-items: center;
}

.weather-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #deefec;
  color: #1897a0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
}

.weather-label {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
}

.weather-current strong {
  display: block;
  color: #2f4858;
  font-size: 1.3rem;
}

.weather-current p,
.weather-current small {
  display: block;
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
}

.forecast-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
}

.forecast-item {
  padding: 10px 8px;
  border-radius: 14px;
  background: #fbf9f1;
  text-align: center;
}

.forecast-item span,
.forecast-item small {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
}

.forecast-item strong {
  display: block;
  color: #2f4858;
  font-size: 0.82rem;
  margin: 2px 0;
}

.weather-empty {
  display: grid;
  place-items: center;
  gap: 4px;
  text-align: center;
  color: #64748b;
}

.weather-empty i {
  font-size: 1.8rem;
  color: #1897a0;
}

.marine-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #eadfca;
}

.marine-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1897a0;
  font-weight: 800;
  font-size: 0.85rem;
  margin-bottom: 10px;
}

.marine-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.marine-item {
  padding: 10px 8px;
  border-radius: 14px;
  background: #fbf9f1;
  text-align: center;
}

.marine-item i {
  color: #1897a0;
  margin-bottom: 4px;
  font-size: 1rem;
}

.marine-item span,
.marine-item small {
  display: block;
  color: #64748b;
  font-size: 0.7rem;
}

.marine-item strong {
  display: block;
  color: #2f4858;
  font-size: 0.85rem;
}

@media (max-width: 576px) {
  .forecast-row,
  .marine-grid {
    grid-template-columns: 1fr;
  }
}
</style>