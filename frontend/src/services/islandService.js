import api from './api'

export async function getIslands(filters = {}) {
  const params = {
    search: filters.search || '',

    continents:
      filters.continents?.join(',') || '',

    activities:
      filters.activities?.join(',') || ''
  }

  const res = await api.get('/islands', {
    params
  })

  return res.data
}

export async function getIslandById(id) {
  const response = await api.get(`/islands/${id}`)
  return response.data
}

export async function getIslandCommunityMedia(id) {
  const response = await api.get(`/islands/${id}/community-media`)
  return response.data
}

export async function getIslandJournals(id) {
  const response = await api.get(`/islands/${id}/journals`)
  return response.data
}

export async function getIslandResidentSpecies(id) {
  const response = await api.get(`/islands/${id}/resident-species`)
  return response.data
}

export async function getIslandRecentSightings(id) {
  const response = await api.get(`/islands/${id}/recent-sightings`)
  return response.data
}

export async function getIslandActivities(id) {
  const response = await api.get(`/islands/${id}/activities`)
  return response.data
}