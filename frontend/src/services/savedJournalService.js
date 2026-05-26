import api from './api'

export async function getSavedJournals() {
  const response = await api.get('/saved-journals')
  return response.data
}

export async function toggleSavedJournal(journalId) {
  const response = await api.post(`/saved-journals/${journalId}/toggle`)
  return response.data
}