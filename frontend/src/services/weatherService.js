import api from './api'

export async function getWeather(latitude, longitude) {
  const response = await api.get('/weather', {
    params: { latitude, longitude }
  })

  return response.data
}

export async function getMarineWeather(latitude, longitude) {
  const response = await api.get('/weather/marine', {
    params: { latitude, longitude }
  })

  return response.data
}