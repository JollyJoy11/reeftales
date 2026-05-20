<script setup>
defineProps({
  weather: {
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
</script>

<template>
  <section class="weather-card">
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
</style>