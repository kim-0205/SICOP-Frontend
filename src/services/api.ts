
const SERVIDORES = {
  local: 'http://localhost:5021',
  produccion: 'https://sicop-backend-sicop-dev-dev.apps.rm1.0a51.p1.openshiftapps.com',
}

const API_URL = import.meta.env.PROD
  ? SERVIDORES.produccion
  : SERVIDORES.local

export async function apiGet<T>(endpoint: string): Promise<T> {
  const url = `${API_URL}${endpoint}`

  const token = sessionStorage.getItem('sicop_token')

  const respuesta = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!respuesta.ok) {
    throw new Error(`Error HTTP: ${respuesta.status}`)
  }

  return (await respuesta.json()) as T
}

export async function apiPost<T>(
  endpoint: string,
  datos: unknown,
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  const token = sessionStorage.getItem('sicop_token')

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(datos),
  })

  if (!respuesta.ok) {
    throw new Error(`Error HTTP: ${respuesta.status}`)
  }

  return (await respuesta.json()) as T
}

export async function apiPut<T>(
  endpoint: string,
  datos: unknown,
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  const token = sessionStorage.getItem('sicop_token')

  const respuesta = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(datos),
  })

  if (!respuesta.ok) {
    throw new Error(`Error HTTP: ${respuesta.status}`)
  }

  if (respuesta.status === 204) {
    return undefined as T
  }

  return (await respuesta.json()) as T
}

export async function apiPatch(
  endpoint: string,
  datos?: unknown,
): Promise<void> {
  const url = `${API_URL}${endpoint}`

  const token = sessionStorage.getItem('sicop_token')

  const respuesta = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...(datos !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(datos !== undefined ? { body: JSON.stringify(datos) } : {}),
  })

  if (!respuesta.ok) {
    const mensaje = await respuesta.text()

    throw new Error(
      mensaje || `Error HTTP: ${respuesta.status}`
    )
  }
}
