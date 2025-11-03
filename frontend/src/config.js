const backendUrl =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export const API_BASE_URL = `${backendUrl.replace(/\/$/, '')}/api`
