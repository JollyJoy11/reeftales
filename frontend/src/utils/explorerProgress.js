export function calculateExplorerProgress({
  journals = [],
  savedIslands = [],
  savedJournals = [],
  itineraries = [],
  speciesChecklist = [],
  aiSpeciesList = [],
  totalMedia = 0,
  visitedCountries = 0,

  // for navbar summary
  journalCount = null,
  speciesCount = null,
  publicCount = null
} = {}) {
  const finalJournalCount = journalCount ?? journals.length
  const finalSpeciesCount = speciesCount ?? speciesChecklist.length
  const finalPublicCount =
    publicCount ?? journals.filter(journal => journal.visibility === 'public').length

  const badges = [
    {
      id: 'first_journey',
      title: 'First Journey',
      detail: 'Create your first journal entry',
      icon: 'bi-journal-check',
      unlocked: finalJournalCount >= 1
    },
    {
      id: 'marine_spotter',
      title: 'Marine Spotter',
      detail: 'Log at least 3 marine species',
      icon: 'bi-water',
      unlocked: finalSpeciesCount >= 3
    },
    {
      id: 'island_collector',
      title: 'Island Collector',
      detail: 'Save at least 3 islands',
      icon: 'bi-bookmark-heart',
      unlocked: savedIslands.length >= 3
    },
    {
      id: 'memory_keeper',
      title: 'Memory Keeper',
      detail: 'Upload 5 photos or videos',
      icon: 'bi-images',
      unlocked: totalMedia >= 5
    },
    {
      id: 'story_saver',
      title: 'Story Saver',
      detail: 'Save at least 3 journals',
      icon: 'bi-bookmark-star',
      unlocked: savedJournals.length >= 3
    },
    {
      id: 'community_voice',
      title: 'Community Voice',
      detail: 'Publish at least 1 public journal',
      icon: 'bi-megaphone',
      unlocked: finalPublicCount >= 1
    },
    {
      id: 'trip_planner',
      title: 'Trip Planner',
      detail: 'Create your first planned trip',
      icon: 'bi-calendar-heart',
      unlocked: itineraries.length >= 1
    },
    {
      id: 'reef_archivist',
      title: 'Reef Archivist',
      detail: 'Create 5 journals',
      icon: 'bi-archive',
      unlocked: finalJournalCount >= 5
    },
    {
      id: 'species_researcher',
      title: 'Species Researcher',
      detail: 'Save 3 AI species identifications',
      icon: 'bi-search-heart',
      unlocked: aiSpeciesList.length >= 3
    },
    {
      id: 'island_hopper',
      title: 'Island Hopper',
      detail: 'Journal trips in 2 countries',
      icon: 'bi-map',
      unlocked: visitedCountries >= 2
    }
  ]

  const unlockedCount = badges.filter(badge => badge.unlocked).length

  const score =
    finalJournalCount +
    Math.floor(finalSpeciesCount / 3) +
    finalPublicCount

  let tier = {
    name: 'New Tide Explorer',
    progress: 16,
    next: 'Island Voyager I'
  }

  if (score >= 12) {
    tier = {
      name: 'Ocean Explorer III',
      progress: 92,
      next: 'Legend Explorer'
    }
  } else if (score >= 7) {
    tier = {
      name: 'Reef Explorer II',
      progress: 68,
      next: 'Ocean Explorer III'
    }
  } else if (score >= 3) {
    tier = {
      name: 'Island Voyager I',
      progress: 38,
      next: 'Reef Explorer II'
    }
  }

  return {
    badges,
    unlockedCount,
    tier,
    score
  }
}
