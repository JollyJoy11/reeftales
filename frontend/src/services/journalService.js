import api from './api'

export async function getPublicJournals(params = {}) {
  const response = await api.get('/journals', {
    params: {
      search: params.search || ''
    }
  })

  return response.data
}

export async function getMyJournals() {
  const response = await api.get('/journals/me/list')
  return response.data
}

export async function getMyJournalSummary() {
  const response = await api.get('/journals/me/summary')
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

export async function uploadJournalMedia(files) {
  const formData = new FormData()

  files.forEach(file => {
    formData.append('files', file)
  })

  const response = await api.post('/uploads/journal-media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data.files
}

export async function addJournalComment(journalId, content) {
  const response = await api.post(`/journals/${journalId}/comments`, { content })
  return response.data
}

export async function toggleJournalLike(journalId) {
  const response = await api.post(`/journals/${journalId}/like`)
  return response.data
}
