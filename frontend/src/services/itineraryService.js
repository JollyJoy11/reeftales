import api from './api'

export async function getItineraries() {
  const response = await api.get('/itineraries')
  return response.data
}

export async function getItineraryById(id) {
  const response = await api.get(`/itineraries/${id}`)
  return response.data
}

export async function createItinerary(data) {
  const response = await api.post('/itineraries', data)
  return response.data
}

export async function updateItinerary(id, data) {
  const response = await api.put(`/itineraries/${id}`, data)
  return response.data
}

export async function deleteItinerary(id) {
  const response = await api.delete(`/itineraries/${id}`)
  return response.data
}
