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
  <div class="detail-section encounters-section">
    <div class="section-title-row">
      <h2>Encounters</h2>
      <span>{{ sightings.length }} logged</span>
    </div>

    <div v-if="sightings.length" class="encounter-grid">
      <article
        v-for="(sighting, index) in sightings"
        :key="sighting.id"
        class="encounter-card"
      >
        <span class="encounter-icon" :class="`tone-${index % 4}`">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fish-icon lucide-fish"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/><path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4"/><path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98"/></svg>
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

    <div v-else class="section-empty-card">
      <i class="bi bi-water"></i>
      <div>
        <strong>No marine encounters logged</strong>
        <span>This diary does not include species sightings yet.</span>
      </div>
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
  color: var(--text-primary);
  font-size: 1.05rem;
  font-weight: 900;
  margin-bottom: 0;
}

.section-title-row span {
  color: var(--accent);
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

.encounter-icon svg {
  width: 18px;
  height: 18px;
}

.encounter-icon.tone-0 {
  background: var(--accent);
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
  color: var(--accent);
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

.section-empty-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background: rgba(251, 249, 241, 0.72);
}

.section-empty-card i {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 1.2rem;
}

.section-empty-card strong,
.section-empty-card span {
  display: block;
}

.section-empty-card strong {
  color: var(--text-primary);
  font-weight: 900;
}

.section-empty-card span {
  color: var(--text-secondary);
  font-size: 0.86rem;
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

