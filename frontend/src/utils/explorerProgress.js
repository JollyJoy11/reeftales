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
      titleKey: 'dashboard.achievementBadges.firstJourney.title',
      detailKey: 'dashboard.achievementBadges.firstJourney.detail',
      icon: 'bi-journal-check',
      unlocked: finalJournalCount >= 1
    },
    {
      id: 'marine_spotter',
      titleKey: 'dashboard.achievementBadges.marineSpotter.title',
      detailKey: 'dashboard.achievementBadges.marineSpotter.detail',
      icon: 'bi-water',
      unlocked: finalSpeciesCount >= 3
    },
    {
      id: 'island_collector',
      titleKey: 'dashboard.achievementBadges.islandCollector.title',
      detailKey: 'dashboard.achievementBadges.islandCollector.detail',
      icon: 'bi-bookmark-heart',
      unlocked: savedIslands.length >= 3
    },
    {
      id: 'memory_keeper',
      titleKey: 'dashboard.achievementBadges.memoryKeeper.title',
      detailKey: 'dashboard.achievementBadges.memoryKeeper.detail',
      icon: 'bi-images',
      unlocked: totalMedia >= 5
    },
    {
      id: 'story_saver',
      titleKey: 'dashboard.achievementBadges.storySaver.title',
      detailKey: 'dashboard.achievementBadges.storySaver.detail',
      icon: 'bi-bookmark-star',
      unlocked: savedJournals.length >= 3
    },
    {
      id: 'community_voice',
      titleKey: 'dashboard.achievementBadges.communityVoice.title',
      detailKey: 'dashboard.achievementBadges.communityVoice.detail',
      icon: 'bi-megaphone',
      unlocked: finalPublicCount >= 1
    },
    {
      id: 'trip_planner',
      titleKey: 'dashboard.achievementBadges.tripPlanner.title',
      detailKey: 'dashboard.achievementBadges.tripPlanner.detail',
      icon: 'bi-calendar-heart',
      unlocked: itineraries.length >= 1
    },
    {
      id: 'reef_archivist',
      titleKey: 'dashboard.achievementBadges.reefArchivist.title',
      detailKey: 'dashboard.achievementBadges.reefArchivist.detail',
      icon: 'bi-archive',
      unlocked: finalJournalCount >= 5
    },
    {
      id: 'species_researcher',
      titleKey: 'dashboard.achievementBadges.speciesResearcher.title',
      detailKey: 'dashboard.achievementBadges.speciesResearcher.detail',
      icon: 'bi-search-heart',
      unlocked: aiSpeciesList.length >= 3
    },
    {
      id: 'island_hopper',
      titleKey: 'dashboard.achievementBadges.islandHopper.title',
      detailKey: 'dashboard.achievementBadges.islandHopper.detail',
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
    progress: 0,
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
