import api from './api'

export async function searchWorms(name) {
  const response = await api.get('/worms/search', {
    params: { name }
  })

  return response.data
}

export async function identifyMarineImage(file) {
  const formData = new FormData()

  formData.append('image', file)

  const response = await api.post(
    '/worms/identify-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )

  return response.data
}

export async function getMyAiIdentifications() {
  const response = await api.get('/worms/identifications/me')
  return response.data
}
