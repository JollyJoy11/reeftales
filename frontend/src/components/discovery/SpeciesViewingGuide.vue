<script setup>
defineProps({
  guide: {
    type: Object,
    required: true
  },
  occurrenceData: {
    type: Object,
    default: null
  },
  uniqueCountries: {
    type: Array,
    default: () => []
  },
  formatCount: {
    type: Function,
    required: true
  }
})
</script>

<template>
  <div class="source-summary-panel h-100">
    <div class="section-heading">
      <span>Viewing Guide</span>
      <h3>How to observe responsibly</h3>
      <p>This guide is estimated from habitat and depth range.</p>
    </div>

    <div class="guide-list">
      <div>
        <i class="bi bi-water"></i>
        <span>Look around</span>
        <strong>{{ guide.habitat }}</strong>
      </div>

      <div>
        <i class="bi bi-rulers"></i>
        <span>Typical depth</span>
        <strong>{{ guide.depthText }}</strong>
      </div>

      <div>
        <i class="bi bi-compass"></i>
        <span>Suggested activity</span>
        <strong>{{ guide.activity }}</strong>
      </div>

      <div>
        <i class="bi bi-stars"></i>
        <span>Viewing level</span>
        <strong>{{ guide.difficulty }}</strong>
      </div>
    </div>

    <div class="responsible-note">
      <i class="bi bi-shield-check"></i>
      {{ guide.conservationNote }}
    </div>

    <details class="data-source-details">
      <summary>About the observation data</summary>

      <div class="source-summary-grid mt-3">
        <div>
          <strong>{{ formatCount(occurrenceData?.obis_count) }}</strong>
          <span>Ocean records</span>
        </div>

        <div>
          <strong>{{ formatCount(occurrenceData?.gbif_count) }}</strong>
          <span>Nature records</span>
        </div>

        <div>
          <strong>{{ formatCount(occurrenceData?.total_count) }}</strong>
          <span>Total mapped records</span>
        </div>

        <div>
          <strong>{{ uniqueCountries.length }}</strong>
          <span>Countries worldwide</span>
        </div>
      </div>
    </details>
  </div>
</template>

<style scoped>
.section-heading span {
  color: #1897a0;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.section-heading h3 {
  color: #2f4858;
  font-weight: 900;
  margin: 2px 0 4px;
}

.section-heading p {
  color: #64748b;
  margin-bottom: 14px;
}

.source-summary-panel {
  position: relative;
  padding: 18px;
  border-radius: 24px;
  background: #fbf9f1;
  border: 1px dashed #eadfca;
}

.guide-list {
  display: grid;
  gap: 10px;
}

.guide-list div {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 2px 10px;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  background: #fffdf8;
  border: 1px solid #eadfca;
}

.guide-list i {
  grid-row: span 2;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #deefec;
  color: #1897a0;
}

.guide-list span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.guide-list strong {
  color: #2f4858;
  font-size: 0.9rem;
}

.responsible-note {
  display: flex;
  gap: 9px;
  margin-top: 12px;
  padding: 12px;
  border-radius: 16px;
  background: #fff8db;
  color: #7c5a00;
  font-size: 0.84rem;
  font-weight: 800;
}

.data-source-details {
  margin-top: 14px;
}

.data-source-details summary {
  cursor: pointer;
  color: #1897a0;
  font-size: 0.82rem;
  font-weight: 900;
}

.source-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 11px;
}

.source-summary-grid div {
  padding: 14px;
  border-radius: 18px;
  background: #fffdf8;
  border: 1px solid #eadfca;
}

.source-summary-grid strong {
  display: block;
  color: #1897a0;
  font-size: 1.25rem;
  font-weight: 900;
}

.source-summary-grid span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
}

@media (max-width: 576px) {
  .source-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>