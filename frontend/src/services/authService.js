import api from './api'

export async function loginUser(email, password) {
  const res = await api.post('/auth/login', {
    email,
    password
  })

  return res.data
}

export async function registerUser(username, email, password) {
  const res = await api.post('/auth/register', {
    username,
    email,
    password
  })

  return res.data
}

export async function getCurrentUser() {
  const res = await api.get('/auth/me')
  return res.data
}

export async function updateProfile(data) {
  const res = await api.put('/auth/me/profile', data)
  return res.data
}

export async function updateSettings(data) {
  const res = await api.put('/auth/me/settings', data)
  return res.data
}

export async function requestPasswordReset(email) {
  const res = await api.post('/auth/forgot-password', { email })
  return res.data
}

export async function resetPassword(token, password) {
  const res = await api.post(`/auth/reset-password/${token}`, { password })
  return res.data
}
