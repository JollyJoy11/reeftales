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
  const res = await api.get(`/islands/${id}`)
  return res.data
}