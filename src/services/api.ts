
/*
 * SICOP - Conexión centralizada con el Backend .NET
 *
 * Local: para trabajar sin OpenShift.
 * Producción: para trabajar con OpenShift.
 */

// 1. Direcciones de nuestros dos Backends.
const SERVIDORES = {
  local: 'http://localhost:5021',
  produccion: 'https://sicop-backend-sicop-dev-dev.apps.rm1.0a51.p1.openshiftapps.com',
}

// 2. Seleccionar automáticamente el entorno.
const API_URL = import.meta.env.PROD
  ? SERVIDORES.produccion
  : SERVIDORES.local

// 3. Función reutilizable para consultar cualquier endpoint.
export async function apiGet<T>(endpoint: string): Promise<T> {
  // Construir la dirección completa.
  const url = `${API_URL}${endpoint}`

  // Enviar petición al Backend.
  const respuesta = await fetch(url)

  // Validar si ocurrió algún error.
  if (!respuesta.ok) {
    throw new Error(`Error HTTP: ${respuesta.status}`)
  }

  // Devolver los datos recibidos.
  return (await respuesta.json()) as T
}
