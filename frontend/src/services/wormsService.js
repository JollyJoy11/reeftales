import api from './api'

export async function searchWorms(name) {
  const response = await api.get('/worms/search', {
    params: { name }
  })

  return response.data
}
