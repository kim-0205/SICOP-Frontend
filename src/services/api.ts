
const SERVIDORES = {
  local: 'http://localhost:5021',
  produccion: 'https://sicop-backend-sicop-dev-dev.apps.rm1.0a51.p1.openshiftapps.com',
}

// 2. Seleccionar automáticamente el entorno.
const API_URL = import.meta.env.PROD
  ? SERVIDORES.produccion
  : SERVIDORES.local

export async function apiGet<T>(endpoint: string): Promise<T> {
  // Construye la URL según el entorno local o producción.
  const url = `${API_URL}${endpoint}`

  // Recupera el token del usuario autenticado.
  const token = sessionStorage.getItem('sicop_token')

  // Realiza la consulta al backend.
  const respuesta = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  // Verifica si la consulta fue exitosa.
  if (!respuesta.ok) {
    throw new Error(`Error HTTP: ${respuesta.status}`)
  }

  // Devuelve los datos recibidos desde SQL Server.
  return (await respuesta.json()) as T
}


/*
 * Envía información al Backend mediante POST.
 * Se utilizará para login, proveedores, facturas y pagos.
 */
export async function apiPost<T>(
  endpoint: string,
  datos: unknown,
): Promise<T> {
  // Construir la dirección utilizando el entorno seleccionado.
  const url = `${API_URL}${endpoint}`

  // Obtener el token JWT si el usuario inició sesión.
  const token = sessionStorage.getItem('sicop_token')

  // Enviar la información al Backend.
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',

      // Agregar autorización únicamente si existe un token.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(datos),
  })

  // Verificar si ocurrió algún error.
  if (!respuesta.ok) {
    throw new Error(`Error HTTP: ${respuesta.status}`)
  }

  // Devolver la respuesta del Backend.
  return (await respuesta.json()) as T
}


/*
 * SICOP - Actualizar registros mediante PUT.
 * Utilizado para editar proveedores y otros registros.
 */
export async function apiPut<T>(
  endpoint: string,
  datos: unknown,
): Promise<T> {
  // Construir la URL según el entorno.
  const url = `${API_URL}${endpoint}`

  // Recuperar el token JWT.
  const token = sessionStorage.getItem('sicop_token')

  // Enviar los cambios al backend.
  const respuesta = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(datos),
  })

  // Comprobar el resultado.
  if (!respuesta.ok) {
    throw new Error(`Error HTTP: ${respuesta.status}`)
  }

  // Algunos endpoints PUT devuelven 204 sin contenido.
  if (respuesta.status === 204) {
    return undefined as T
  }

  return (await respuesta.json()) as T
}



/*
 * SICOP - Actualizar parcialmente registros mediante PATCH.
 * Permite activar y desactivar proveedores en SQL Server.
 */
export async function apiPatch(
  endpoint: string,
  datos?: unknown,
): Promise<void> {

  // Seleccionar automáticamente el backend local o de OpenShift.
  const url = `${API_URL}${endpoint}`

  // Obtener el token JWT del usuario autenticado.
  const token = sessionStorage.getItem('sicop_token')

  // Enviar la solicitud PATCH al backend.
  const respuesta = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...(datos !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(datos !== undefined ? { body: JSON.stringify(datos) } : {}),
  })

  // Detectar errores del backend.
  if (!respuesta.ok) {
    const mensaje = await respuesta.text()

    throw new Error(
      mensaje || `Error HTTP: ${respuesta.status}`
    )
  }

}



