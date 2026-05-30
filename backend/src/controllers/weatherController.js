async function getWeather(req, res) {
  const { latitude, longitude, start_date, end_date } = req.query

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required' })
  }

  try {
    const endpoint = new URL('https://api.open-meteo.com/v1/forecast')

    endpoint.searchParams.set('latitude', latitude)
    endpoint.searchParams.set('longitude', longitude)
    endpoint.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m')
    endpoint.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max')
    endpoint.searchParams.set('timezone', 'auto')

    if (start_date && end_date) {
      endpoint.searchParams.set('start_date', start_date)
      endpoint.searchParams.set('end_date', end_date)
    } else {
      endpoint.searchParams.set('forecast_days', '3')
    }

    const response = await fetch(endpoint)

    if (!response.ok) {
      return res.status(response.status).json({ message: 'Weather API failed' })
    }

    const data = await response.json()

    res.json({
      current: data.current,
      daily: data.daily,
      timezone: data.timezone,
      requested_range: start_date && end_date ? { start_date, end_date } : null
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch weather' })
  }
}

async function getMarineWeather(req, res) {
  const { latitude, longitude } = req.query

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required' })
  }

  try {
    const endpoint = new URL('https://marine-api.open-meteo.com/v1/marine')

    endpoint.searchParams.set('latitude', latitude)
    endpoint.searchParams.set('longitude', longitude)
    endpoint.searchParams.set(
      'current',
      'wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction'
    )
    endpoint.searchParams.set('timezone', 'auto')

    const response = await fetch(endpoint)

    if (!response.ok) {
      return res.status(response.status).json({ message: 'Marine weather API failed' })
    }

    const data = await response.json()

    res.json({
      current: data.current,
      current_units: data.current_units,
      timezone: data.timezone
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch marine weather' })
  }
}

module.exports = {
  getWeather,
  getMarineWeather
}
