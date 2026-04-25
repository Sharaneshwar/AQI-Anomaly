// Backend URL.
//
// Local dev: defaults to http://localhost:8000.
// Anywhere else (Vercel prod, preview, staging): set VITE_BACKEND_URL.

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export const API_BASE_URL = `${backendUrl.replace(/\/$/, '')}/api`
