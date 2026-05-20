import api from './api'

export async function getWeather(latitude, longitude) {
  const response = await api.get('/weather', {
    params: {
      latitude,
      longitude
    }
  })

  return response.data
}