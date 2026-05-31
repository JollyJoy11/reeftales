<script setup>
import { computed } from 'vue'

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

const activities = computed(() => {
  const avgRain = average(props.weather?.daily?.precipitation_probability_max || [])
  const wave = Number(props.marine?.current?.wave_height ?? 0)
  const wind = Number(props.weather?.current?.wind_speed_10m ?? 0)

  return [
    { name: 'Snorkelling', icon: 'bi bi-mask', score: scoreSnorkelling(avgRain, wave, wind) },
    { name: 'Kayaking', icon: 'bi bi-water', score: scoreKayaking(avgRain, wave, wind) },
    { name: 'Scuba Diving', icon: 'bi bi-tsunami', score: scoreDiving(avgRain, wave, wind) },
    { name: 'Island Hopping', icon: 'bi bi-compass', score: scoreIslandHopping(avgRain, wave, wind) },
    { name: 'Reef Photography', icon: 'bi bi-camera', score: scorePhotography(avgRain, wave, wind) },
    { name: 'Sunset Watching', icon: 'bi bi-sunset', score: scoreSunset(avgRain, wave, wind) }
  ]
})

function average(values) {
  const valid = values.map(Number).filter(Number.isFinite)
  if (!valid.length) return 0
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function rainPenalty(rain) {
  if (rain >= 85) return 3
  if (rain >= 70) return 2
  if (rain >= 45) return 1
  return 0
}

function scoreSnorkelling(rain, wave, wind) {
  let score = 5
  score -= rainPenalty(rain)
  if (wave > 1.2) score--
  if (wave > 2) score--
  if (wind > 25) score--
  return Math.max(1, score)
}

function scoreKayaking(rain, wave, wind) {
  let score = 5
  if (rain > 55) score--
  if (wave > 1.5) score--
  if (wind > 22) score--
  if (wind > 35) score--
  return Math.max(1, score)
}

function scoreDiving(rain, wave, wind) {
  let score = 5
  if (rain > 60) score--
  if (wave > 1.5) score--
  if (wave > 2) score--
  if (wind > 30) score--
  return Math.max(1, score)
}

function scoreIslandHopping(rain, wave, wind) {
  let score = 5
  if (rain > 50) score--
  if (rain > 75) score--
  if (wave > 1.8) score--
  if (wind > 30) score--
  return Math.max(1, score)
}

function scorePhotography(rain, wave, wind) {
  let score = 5
  if (rain > 45) score--
  if (rain > 70) score--
  if (wind > 35) score--
  return Math.max(1, score)
}

function scoreSunset(rain, wave, wind) {
  let score = 5
  if (rain > 40) score--
  if (rain > 65) score--
  if (wind > 35) score--
  return Math.max(1, score)
}

function scoreLabel(score) {
  if (score >= 5) return 'Excellent'
  if (score >= 4) return 'Good'
  if (score >= 3) return 'Caution'
  if (score >= 2) return 'Poor'
  return 'Not ideal'
}

function scoreStars(score) {
  return '★★★★★'.slice(0, score) + '☆☆☆☆☆'.slice(0, 5 - score)
}
</script>

<template>
  <section v-if="weather || marine" class="activity-suitability-card">
    <div class="activity-heading">
      <span>Marine Activity Suitability</span>
      <strong>Best activities for your selected dates</strong>
      <p>Based on rain, wind, wave height, and sea movement.</p>
    </div>

    <div class="activity-grid">
      <article
        v-for="activity in activities"
        :key="activity.name"
        class="activity-card"
      >
        <div class="activity-icon">
          <i :class="activity.icon"></i>
        </div>

        <div>
          <strong>{{ activity.name }}</strong>
          <span>{{ scoreLabel(activity.score) }}</span>
          <small>{{ scoreStars(activity.score) }}</small>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.activity-suitability-card {
  margin-top: 14px;
  padding: 16px;
  border: 1px dashed #d8cdbb;
  border-radius: 20px;
  background: #fffdf8;
}

.activity-heading span {
  color: #1897a0;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.activity-heading strong {
  display: block;
  margin-top: 4px;
  color: #2f4858;
  font-size: 1rem;
}

.activity-heading p {
  margin: 4px 0 14px;
  color: #64748b;
  font-size: 0.82rem;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.activity-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 16px;
  background: #fbf9f1;
  border: 1px solid #eadfca;
}

.activity-icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #deefec;
  color: #1897a0;
}

.activity-card strong,
.activity-card span,
.activity-card small {
  display: block;
}

.activity-card strong {
  color: #2f4858;
  font-size: 0.82rem;
}

.activity-card span {
  color: #1897a0;
  font-size: 0.72rem;
  font-weight: 900;
}

.activity-card small {
  margin-top: 2px;
  color: #bd704e;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
}

@media (max-width: 991px) {
  .activity-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 575px) {
  .activity-grid {
    grid-template-columns: 1fr;
  }
}
</style>