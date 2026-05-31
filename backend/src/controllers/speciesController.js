const {
  getAllSpecies,
  getSpeciesById,
  getSpeciesLocalSummary,
  getSpeciesMedia
} = require('../models/speciesModel')

async function fetchSpecies(req, res) {
  try {
    const species = await getAllSpecies({
      search: req.query.search,
      categories: req.query.categories
        ? req.query.categories.split(',')
        : [],
      minDepth: req.query.minDepth,
      maxDepth: req.query.maxDepth
    })

    res.json(species)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch species' })
  }
}

async function fetchSpeciesById(req, res) {
  try {
    const species = await getSpeciesById(req.params.id)

    if (!species) {
      return res.status(404).json({ message: 'Species not found' })
    }

    const [localSummary, media] = await Promise.all([
      getSpeciesLocalSummary(req.params.id),
      getSpeciesMedia(req.params.id)
    ])

    res.json({
      ...species,
      local_summary: localSummary,
      media
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch species details' })
  }
}

async function fetchJson(endpoint) {
  const response = await fetch(endpoint)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  return response.json()
}

function normalizeOccurrence(item, source) {
  const latitude =
    item.decimalLatitude ??
    item.decimallatitude ??
    item.latitude

  const longitude =
    item.decimalLongitude ??
    item.decimallongitude ??
    item.longitude

  if (latitude === undefined || longitude === undefined) return null

  return {
    source,
    latitude: Number(latitude),
    longitude: Number(longitude),
    event_date:
      item.eventDate ||
      item.eventdate ||
      item.dateIdentified ||
      item.year ||
      null,
    country:
      item.country ||
      item.countryCode ||
      null,
    locality:
      item.locality ||
      null
  }
}

async function fetchObisOccurrences(scientificName) {
  const endpoint = new URL('https://api.obis.org/v3/occurrence')

  endpoint.searchParams.set('scientificname', scientificName)
  endpoint.searchParams.set('size', '80')

  const data = await fetchJson(endpoint)

  return (data.results || [])
    .map(item => normalizeOccurrence(item, 'OBIS'))
    .filter(Boolean)
}

async function fetchGbifOccurrences(scientificName) {
  const endpoint = new URL('https://api.gbif.org/v1/occurrence/search')

  endpoint.searchParams.set('scientificName', scientificName)
  endpoint.searchParams.set('hasCoordinate', 'true')
  endpoint.searchParams.set('limit', '80')

  const data = await fetchJson(endpoint)

  return (data.results || [])
    .map(item => normalizeOccurrence(item, 'GBIF'))
    .filter(Boolean)
}

function buildSeasonalSummary(occurrences) {
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    count: 0
  }))

  occurrences.forEach(item => {
    if (!item.event_date) return

    const date = new Date(item.event_date)
    if (Number.isNaN(date.getTime())) return

    months[date.getMonth()].count++
  })

  return months
}

async function fetchSpeciesOccurrences(req, res) {
  try {
    const species = await getSpeciesById(req.params.id)

    if (!species) {
      return res.status(404).json({ message: 'Species not found' })
    }

    const scientificName = species.scientific_name || species.name

    const [obisResult, gbifResult] = await Promise.allSettled([
      fetchObisOccurrences(scientificName),
      fetchGbifOccurrences(scientificName)
    ])

    const obis =
      obisResult.status === 'fulfilled'
        ? obisResult.value
        : []

    const gbif =
      gbifResult.status === 'fulfilled'
        ? gbifResult.value
        : []

    const occurrences = [...obis, ...gbif]

    res.json({
      scientific_name: scientificName,
      obis_count: obis.length,
      gbif_count: gbif.length,
      total_count: occurrences.length,
      occurrences,
      seasonal_summary: buildSeasonalSummary(occurrences)
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Failed to fetch species occurrence data'
    })
  }
}

module.exports = {
  fetchSpecies,
  fetchSpeciesById,
  fetchSpeciesOccurrences
}
