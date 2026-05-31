import api from './api'

export async function getSpecies(params = {}) {
  const response = await api.get('/species', {
    params: {
      search: params.search || '',
      categories: params.categories?.join(',') || '',
      minDepth: params.minDepth,
      maxDepth: params.maxDepth
    }
  })

  return response.data
}

export async function getSpeciesById(id) {
  const response = await api.get(`/species/${id}`)
  return response.data
}

export async function getSpeciesOccurrences(id) {
  const response = await api.get(`/species/${id}/occurrences`)
  return response.data
}
