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
  }
})

const activities = computed(() => {
  const avgRain = average(props.weather?.daily?.precipitation_probability_max || [])
  const wave = Number(props.marine?.current?.wave_height ?? 0)
  const wind = Number(props.weather?.current?.wind_speed_10m ?? 0)

  return [
    { name: t('planner.snorkelling'), icon: 'bi bi-mask', score: scoreSnorkelling(avgRain, wave, wind) },
    { name: t('planner.kayaking'), icon: 'bi bi-water', score: scoreKayaking(avgRain, wave, wind) },
    { name: t('planner.scubaDiving'), icon: 'bi bi-tsunami', score: scoreDiving(avgRain, wave, wind) },
    { name: t('planner.islandHopping'), icon: 'bi bi-compass', score: scoreIslandHopping(avgRain, wave, wind) },
    { name: t('planner.reefPhotography'), icon: 'bi bi-camera', score: scorePhotography(avgRain, wave, wind) },
    { name: t('planner.sunsetWatching'), icon: 'bi bi-sunset', score: scoreSunset(avgRain, wave, wind) }
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
  if (score >= 5) return t('planner.excellent')
  if (score >= 4) return t('planner.good')
  if (score >= 3) return t('planner.caution')
  if (score >= 2) return t('planner.poor')
  return t('planner.notIdeal')
}

function scoreStars(score) {
  return '★★★★★'.slice(0, score) + '☆☆☆☆☆'.slice(0, 5 - score)
}
</script>

<template>
  <section v-if="weather || marine" class="activity-suitability-card">
    <div class="activity-heading">
      <span>{{ t('planner.activitySuitability') }}</span>
      <strong>{{ t('planner.bestActivities') }}</strong>
      <p>{{ t('planner.activitySuitabilityHint') }}</p>
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
  border: 1px dashed var(--border);
  border-radius: 20px;
  background: var(--surface);
}

.activity-heading span {
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.activity-heading strong {
  display: block;
  margin-top: 4px;
  color: var(--text-primary);
  font-size: 1rem;
}

.activity-heading p {
  margin: 4px 0 14px;
  color: var(--text-secondary);
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
  background: var(--surface-soft);
  border: 1px solid #eadfca;
}

.activity-icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
}

.activity-card strong,
.activity-card span,
.activity-card small {
  display: block;
}

.activity-card strong {
  color: var(--text-primary);
  font-size: 0.82rem;
}

.activity-card span {
  color: var(--accent);
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
