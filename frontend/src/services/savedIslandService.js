import api from './api'

export async function getSavedIslands() {
  const response = await api.get('/saved-islands')
  return response.data
}

export async function toggleSavedIsland(islandId) {
  const response = await api.post(`/saved-islands/${islandId}/toggle`)
  return response.data
}