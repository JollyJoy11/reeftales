<script setup>
defineProps({
  sightings: {
    type: Array,
    default: () => []
  }
})

function sightingName(sighting) {
  return sighting.species_name || sighting.custom_species_name || 'Marine life'
}

function sightingQuantity(sighting) {
  const quantity = Number(sighting.quantity || 1)
  return `${quantity} ${quantity === 1 ? 'encounter' : 'encounters'}`
}
</script>

<template>
  <div class="detail-section encounters-section" v-if="sightings.length">
    <div class="section-title-row">
      <h2>Encounters</h2>
      <span>{{ sightings.length }} logged</span>
    </div>

    <div class="encounter-grid">
      <article
        v-for="(sighting, index) in sightings"
        :key="sighting.id"
        class="encounter-card"
      >
        <span class="encounter-icon" :class="`tone-${index % 4}`">
          <i class="bi bi-water"></i>
        </span>

        <div class="encounter-body">
          <div class="encounter-heading">
            <strong>{{ sightingName(sighting) }}</strong>
            <span>{{ sightingQuantity(sighting) }}</span>
          </div>
          <p v-if="sighting.notes">{{ sighting.notes }}</p>
          <p v-else class="muted-note">No notes added for this encounter.</p>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.detail-section {
  margin-top: 22px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title-row h2 {
  color: #2f4858;
  font-size: 1.05rem;
  font-weight: 900;
  margin-bottom: 0;
}

.section-title-row span {
  color: #1897a0;
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.encounter-grid {
  display: grid;
  gap: 12px;
}

.encounter-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 14px;
  border: 1px solid #eadfca;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(222,239,236,0.82), rgba(255,253,248,0.92) 46%),
    #fffdf8;
  box-shadow: 0 10px 22px rgba(47,72,88,0.07);
}

.encounter-icon {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #ffffff;
  box-shadow: inset 0 -3px 0 rgba(47,72,88,0.12);
  transform: rotate(-4deg);
}

.encounter-icon.tone-0 {
  background: #1897a0;
}

.encounter-icon.tone-1 {
  background: #2a9d8f;
}

.encounter-icon.tone-2 {
  background: #5e8fb3;
}

.encounter-icon.tone-3 {
  background: #c9912e;
}

.encounter-body {
  min-width: 0;
}

.encounter-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.encounter-heading strong {
  color: #1f4e5f;
  font-weight: 900;
  line-height: 1.25;
}

.encounter-heading span {
  flex: 0 0 auto;
  border: 1px dashed rgba(24,151,160,0.42);
  border-radius: 999px;
  padding: 4px 8px;
  color: #1897a0;
  background: rgba(255,255,255,0.72);
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}

.encounter-card p {
  margin: 8px 0 0;
  color: #55677d;
  font-size: 0.88rem;
  line-height: 1.55;
}

.encounter-card .muted-note {
  color: #91a0b3;
  font-style: italic;
}

@media (max-width: 576px) {
  .encounter-card {
    grid-template-columns: 36px minmax(0, 1fr);
    padding: 12px;
  }

  .encounter-icon {
    width: 36px;
    height: 36px;
    border-radius: 14px;
  }

  .encounter-heading {
    flex-direction: column;
    gap: 6px;
  }

  .encounter-heading span {
    white-space: normal;
  }
}
</style>
