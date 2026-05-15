import api from './api'

export async function getSpecies(params = {}) {
  const response = await api.get('/species', {
    params: {
      search: params.search || '',
      categories: params.categories?.join(',') || ''
    }
  })

  return response.data
}