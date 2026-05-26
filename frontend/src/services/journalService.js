import api from './api'

export async function getPublicJournals(params = {}) {
  const response = await api.get('/journals', {
    params: {
      search: params.search || ''
    }
  })

  return response.data
}

export async function getJournalById(id) {
  const response = await api.get(`/journals/${id}`)
  return response.data
}

export async function getTrendingIslands() {
  const response = await api.get('/journals/trending/islands')
  return response.data
}

export async function getTopExplorers() {
  const response = await api.get('/journals/top/explorers')
  return response.data
}

export async function createJournal(data) {
  const response = await api.post('/journals', data)
  return response.data
}