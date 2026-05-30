import api from './api'

export async function getWeather(latitude, longitude, params = {}) {
  const response = await api.get('/weather', {
    params: {
      latitude,
      longitude,
      start_date: params.startDate,
      end_date: params.endDate
    }
  })

  return response.data
}

export async function getMarineWeather(latitude, longitude) {
  const response = await api.get('/weather/marine', {
    params: { latitude, longitude }
  })

  return response.data
}
