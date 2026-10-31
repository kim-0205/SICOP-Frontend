
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { apiGet, apiPost, apiPut, apiPatch } from '@/services/api'
import UsuarioModal from '../../components/UsuarioModal.vue'

// ============================================
// INTERFACES
// ============================================

// Representa un rol disponible en SICOP.
interface Rol {
  rolId: number
  nombre: string
}

// Representa los datos visibles de un usuario.
// No incluimos PasswordHash ni VersionToken.
interface Usuario {
  usuarioId: number
  nombre: string
  correo: string
  rolId: number
  activo: boolean
}

// Datos recibidos desde el formulario.
interface DatosUsuario {
  usuarioId?: number
  nombre: string
  correo: string
  rolId: number
  activo: boolean
  password?: string
  enviarCorreo?: boolean
}

// ============================================
// DATOS TEMPORALES
// ============================================

// Estos IDs son únicamente de prueba.
// Posteriormente vendrán de SQL Server.
const roles = ref<Rol[]>([
  { rolId: 1, nombre: 'Administrador General' },
  { rolId: 2, nombre: 'Operador' }
])


// Usuarios reales obtenidos desde SQL Server.
const usuarios = ref<Usuario[]>([])

// Estado de la consulta.
const cargandoUsuarios = ref(false)
const errorUsuarios = ref('')

// Consultar los usuarios registrados en el backend.
async function cargarUsuarios(): Promise<void> {
  cargandoUsuarios.value = true
  errorUsuarios.value = ''

  try {
    // El backend devuelve los usuarios sin sus contraseñas.
    usuarios.value = await apiGet<Usuario[]>('/api/Usuarios')

  } catch (error) {
    console.error('Error al cargar usuarios:', error)

    errorUsuarios.value =
      'No fue posible consultar los usuarios del sistema.'

  } finally {
    cargandoUsuarios.value = false
  }
}

// Cargar los usuarios al abrir la pantalla.
onMounted(async () => {
  await cargarUsuarios()
})

// ============================================
// ESTADOS DE LA VISTA
// ============================================

const busqueda = ref('')
const mostrarModal = ref(false)
const usuarioSeleccionado = ref<Usuario | null>(null)

  // ============================================
// MODALES DE ACTIVACIÓN Y DESACTIVACIÓN
// ============================================

const mostrarModalConfirmacion = ref(false)
const mostrarModalAviso = ref(false)

const usuarioParaCambiarEstado = ref<Usuario | null>(null)
const mensajeAviso = ref('')
const procesandoEstado = ref(false)

// ============================================
// PROPIEDADES CALCULADAS
// ============================================

// Usuarios que coinciden con la búsqueda.
const usuariosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()

  if (!texto) return usuarios.value

  return usuarios.value.filter(usuario => {
    const nombreRol = obtenerNombreRol(usuario.rolId)

    return (
      usuario.nombre.toLowerCase().includes(texto) ||
      usuario.correo.toLowerCase().includes(texto) ||
      nombreRol.toLowerCase().includes(texto)
    )
  })
})

// Cantidad total de usuarios.
const totalUsuarios = computed(() => usuarios.value.length)

// Cantidad de usuarios activos.
const usuariosActivos = computed(() =>
  usuarios.value.filter(usuario => usuario.activo).length
)

// Cantidad de usuarios inactivos.
const usuariosInactivos = computed(() =>
  usuarios.value.filter(usuario => !usuario.activo).length
)

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Obtiene el nombre del rol a partir de su ID.
function obtenerNombreRol(rolId: number): string {
  return (
    roles.value.find(rol => rol.rolId === rolId)?.nombre ??
    'Sin rol'
  )
}

// ============================================
// MODAL DE USUARIOS
// ============================================

// Abre el formulario para registrar un usuario.
function nuevoUsuario() {
  usuarioSeleccionado.value = null
  mostrarModal.value = true
}

// Abre el formulario con los datos del usuario.
function editarUsuario(usuario: Usuario) {
  usuarioSeleccionado.value = { ...usuario }
  mostrarModal.value = true
}

// Cierra el formulario.
function cerrarModal() {
  mostrarModal.value = false
  usuarioSeleccionado.value = null
}

// ============================================
// GUARDAR USUARIO
// ============================================

// ============================================
// GUARDAR USUARIO EN SQL SERVER
// ============================================

async function guardarUsuario(datos: DatosUsuario): Promise<void> {

  // EDITAR USUARIO EN SQL SERVER
if (datos.usuarioId !== undefined) {
  try {
    // Preparar únicamente los campos permitidos.
    const usuarioActualizado = {
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim().toLowerCase(),
      rolId: datos.rolId
    }

    // Actualizar el usuario en el backend.
    await apiPut<void>(
      `/api/Usuarios/${datos.usuarioId}`,
      usuarioActualizado
    )

    // Cambiar la contraseña solamente si el administrador ingresó una nueva.
    if (datos.password) {
      await apiPatch(
        `/api/Usuarios/${datos.usuarioId}/cambiar-password?notificarCorreo=${datos.enviarCorreo === true}`,
        {
          nuevaPassword: datos.password
        }
      )
    }

    // Consultar nuevamente los usuarios reales.
    await cargarUsuarios()

    // Cerrar el formulario después de actualizar.
    cerrarModal()

  } catch (error) {
    console.error('Error al editar usuario:', error)

    const mensaje = error instanceof Error
      ? error.message
      : 'No fue posible actualizar el usuario.'

    if (mensaje.includes('409')) {
      alert('Ya existe otro usuario registrado con ese correo electrónico.')
    } else {
      alert(mensaje)
    }
  }

  return
}

  try {
    // Validar que el formulario incluya una contraseña.
    if (!datos.password?.trim()) {
      alert('Debe ingresar una contraseña.')
      return
    }

    // Preparar los datos que recibe CrearUsuarioDto.
    const nuevoUsuario = {
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim().toLowerCase(),
      password: datos.password,
      rolId: datos.rolId
    }

   // Registrar el usuario mediante el backend.
    // Envía las credenciales por correo solo si se seleccionó la opción.
    await apiPost<Usuario>(
      `/api/Usuarios?notificarCorreo=${datos.enviarCorreo === true}`,
      nuevoUsuario
    )

    // Actualizar la tabla con los usuarios reales.
    await cargarUsuarios()

    // Cerrar el formulario después de guardar.
    cerrarModal()

  } catch (error) {
    console.error('Error al registrar usuario:', error)

    const mensaje = error instanceof Error
      ? error.message
      : 'No fue posible registrar el usuario.'

    if (mensaje.includes('409')) {
      alert('Ya existe un usuario registrado con ese correo electrónico.')
    } else {
      alert(mensaje)
    }
  }
}

// ============================================
// ABRIR MODAL DE CONFIRMACIÓN
// ============================================

function cambiarEstado(usuario: Usuario): void {

  // Identificar al usuario que inició sesión.
  const sesion = sessionStorage.getItem('sicop_usuario')

  let usuarioActualId: number | null = null

  if (sesion) {
    try {
      const usuarioActual = JSON.parse(sesion) as {
        usuarioId?: number
      }

      usuarioActualId = Number(usuarioActual.usuarioId)

    } catch {
      usuarioActualId = null
    }
  }

  // Impedir que un administrador se desactive a sí mismo.
  if (usuario.activo && usuario.usuarioId === usuarioActualId) {
    mensajeAviso.value =
      'No puedes desactivar tu propia cuenta. Por seguridad, esta acción debe realizarla otro Administrador General.'

    mostrarModalAviso.value = true
    return
  }

  // Preparar el usuario que se desea activar o desactivar.
  usuarioParaCambiarEstado.value = { ...usuario }
  mostrarModalConfirmacion.value = true
}

// ============================================
// CERRAR MODALES
// ============================================

function cerrarModalConfirmacion(): void {
  if (procesandoEstado.value) return

  mostrarModalConfirmacion.value = false
  usuarioParaCambiarEstado.value = null
}

function cerrarModalAviso(): void {
  mostrarModalAviso.value = false
  mensajeAviso.value = ''
}

// ============================================
// CONFIRMAR CAMBIO DE ESTADO EN SQL SERVER
// ============================================

async function confirmarCambioEstado(): Promise<void> {

  const usuario = usuarioParaCambiarEstado.value

  if (!usuario || procesandoEstado.value) return

  procesandoEstado.value = true

  try {
    // Seleccionar el endpoint correspondiente.
    const endpoint = usuario.activo
      ? `/api/Usuarios/${usuario.usuarioId}/desactivar`
      : `/api/Usuarios/${usuario.usuarioId}/activar`

    // Actualizar el estado en SQL Server.
    await apiPatch(endpoint)

    // Actualizar la tabla.
    await cargarUsuarios()

    mostrarModalConfirmacion.value = false
    usuarioParaCambiarEstado.value = null

  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error)

    mensajeAviso.value = error instanceof Error
      ? error.message
      : 'No fue posible actualizar el estado del usuario.'

    mostrarModalConfirmacion.value = false
    usuarioParaCambiarEstado.value = null
    mostrarModalAviso.value = true

  } finally {
    procesandoEstado.value = false
  }
}


</script>



<template>
  <div class="usuarios-page">
    <!-- ENCABEZADO -->
    <div class="page-header">
      <div>
        <span class="section-label">SEGURIDAD Y ACCESOS</span>
        <h1>Administración de usuarios</h1>
        <p>
          Gestione los usuarios, sus roles y el acceso al sistema.
        </p>
      </div>

      <button class="btn-primary" @click="nuevoUsuario">
        <span class="btn-plus">+</span>
        Nuevo usuario
      </button>
    </div>

    <!-- TARJETAS DE RESUMEN -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon purple">👥</div>
        <div>
          <span>Total de usuarios</span>
          <strong>{{ totalUsuarios }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">✓</div>
        <div>
          <span>Usuarios activos</span>
          <strong>{{ usuariosActivos }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">○</div>
        <div>
          <span>Usuarios inactivos</span>
          <strong>{{ usuariosInactivos }}</strong>
        </div>
      </div>
    </div>

    <!-- TABLA DE USUARIOS -->
    <section class="content-card">
      <div class="card-header">
        <div>
          <h2>Usuarios registrados</h2>
          <p>Consulte y administre los usuarios del sistema.</p>
        </div>

        <div class="search-container">
          <span class="search-icon">⌕</span>
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar usuario..."
            aria-label="Buscar usuario"
          />
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre completo</th>
              <th>Correo electrónico</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="usuario in usuariosFiltrados"
              :key="usuario.usuarioId"
            >
              <td class="id-cell">
                #{{ usuario.usuarioId }}
              </td>

              <td>
                <div class="user-info">
                  <div class="avatar">
                    {{ usuario.nombre.charAt(0).toUpperCase() }}
                  </div>

                  <span class="user-name">
                    {{ usuario.nombre }}
                  </span>
                </div>
              </td>

              <td>{{ usuario.correo }}</td>

              <td>
                <span
                  class="role-badge"
                  :class="{
                    'role-admin':
                      obtenerNombreRol(usuario.rolId) ===
                      'Administrador General'
                  }"
                >
                  {{ obtenerNombreRol(usuario.rolId) }}
                </span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="usuario.activo ? 'active' : 'inactive'"
                >
                  <span class="status-dot"></span>
                  {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>

              <td>
                <div class="actions">
                  <button
                    class="btn-edit"
                    title="Editar usuario"
                    @click="editarUsuario(usuario)"
                  >
                    Editar
                  </button>

                  <button
                    class="btn-status"
                    :class="usuario.activo ? 'deactivate' : 'activate'"
                    :title="usuario.activo ? 'Desactivar' : 'Activar'"
                    @click="cambiarEstado(usuario)"
                  >
                    {{ usuario.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!cargandoUsuarios && !errorUsuarios && usuariosFiltrados.length === 0">
              <td colspan="6" class="empty-state">
                No se encontraron usuarios con esa búsqueda.
              </td>
            </tr>
            <tr v-if="cargandoUsuarios">
            <td colspan="6" class="empty-state">
              Cargando usuarios desde el servidor...
            </td>
          </tr>

          <tr v-else-if="errorUsuarios">
            <td colspan="6" class="empty-state">
              {{ errorUsuarios }}
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        Mostrando {{ usuariosFiltrados.length }} de
        {{ totalUsuarios }} usuarios
      </div>
    </section>

    <!-- FORMULARIO PARA REGISTRAR Y EDITAR -->
    <UsuarioModal
      :visible="mostrarModal"
      :usuario="usuarioSeleccionado"
      :roles="roles"
      @cerrar="cerrarModal"
      @guardar="guardarUsuario"
    />

    <!-- ============================================
     MODAL 1: CONFIRMAR ACTIVACIÓN/DESACTIVACIÓN
============================================ -->
<div
  v-if="mostrarModalConfirmacion && usuarioParaCambiarEstado"
  class="usuario-dialog-overlay"
  @click.self="cerrarModalConfirmacion"
>
  <section
    class="usuario-dialog"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="titulo-confirmacion-usuario"
  >
    <div class="usuario-dialog-icon">?</div>

    <h2 id="titulo-confirmacion-usuario">
      {{ usuarioParaCambiarEstado.activo
        ? 'Desactivar usuario'
        : 'Activar usuario' }}
    </h2>

    <p>
      ¿Estás seguro de que deseas
      {{ usuarioParaCambiarEstado.activo ? 'desactivar' : 'activar' }}
      a <strong>{{ usuarioParaCambiarEstado.nombre }}</strong>?
    </p>

    <p class="usuario-dialog-detail">
      {{ usuarioParaCambiarEstado.activo
        ? 'El usuario no podrá iniciar sesión hasta que vuelva a ser activado.'
        : 'El usuario podrá iniciar sesión nuevamente con sus credenciales.' }}
    </p>

    <div class="usuario-dialog-actions">
      <button
        type="button"
        class="usuario-dialog-cancel"
        :disabled="procesandoEstado"
        @click="cerrarModalConfirmacion"
      >
        Cancelar
      </button>

      <button
        type="button"
        class="usuario-dialog-primary"
        :disabled="procesandoEstado"
        @click="confirmarCambioEstado"
      >
        {{ procesandoEstado
          ? 'Procesando...'
          : usuarioParaCambiarEstado.activo
            ? 'Desactivar usuario'
            : 'Activar usuario' }}
      </button>
    </div>
  </section>
</div>

<!-- ============================================
     MODAL 2: ACCIÓN NO PERMITIDA / AVISO
============================================ -->
<div
  v-if="mostrarModalAviso"
  class="usuario-dialog-overlay"
  @click.self="cerrarModalAviso"
>
  <section
    class="usuario-dialog"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="titulo-aviso-usuario"
  >
    <div class="usuario-dialog-icon">!</div>

    <h2 id="titulo-aviso-usuario">
      Acción no permitida
    </h2>

    <p>{{ mensajeAviso }}</p>

    <div class="usuario-dialog-actions">
      <button
        type="button"
        class="usuario-dialog-primary"
        @click="cerrarModalAviso"
      >
        Entendido
      </button>
    </div>
  </section>
</div>
  </div>
</template>

<style scoped>
.usuarios-page {
  padding: 30px;
  color: #352057;
  font-family: 'Segoe UI', Arial, sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}

.section-label {
  color: #916cbb;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.page-header h1 {
  margin: 8px 0;
  color: #352057;
  font-size: 27px;
  font-weight: 750;
}

.page-header p,
.card-header p {
  margin: 0;
  color: #9b8aaa;
  font-size: 13px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 20px;
  border: none;
  border-radius: 11px;
  background: #7950ae;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.btn-primary:hover {
  background: #633e96;
}

.btn-plus {
  font-size: 21px;
  line-height: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 26px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 23px;
  border: 1px solid #eee6f5;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(66, 36, 97, 0.04);
}

.stat-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 14px;
  font-size: 21px;
}

.stat-icon.purple {
  background: #f1e9fb;
  color: #7950ae;
}

.stat-icon.green {
  background: #e7f7ef;
  color: #23965e;
}

.stat-icon.orange {
  background: #fff2e6;
  color: #df9346;
}

.stat-card > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.stat-card span {
  color: #9685a6;
  font-size: 12px;
}

.stat-card strong {
  color: #352057;
  font-size: 26px;
}

.content-card {
  overflow: hidden;
  border: 1px solid #eee6f5;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(66, 36, 97, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 25px;
}

.card-header h2 {
  margin: 0 0 7px;
  color: #493078;
  font-size: 18px;
}

.search-container {
  position: relative;
  width: 260px;
}

.search-container input {
  width: 100%;
  padding: 12px 14px 12px 36px;
  border: 1px solid #e6dcf0;
  border-radius: 10px;
  outline: none;
  background: #fcfaff;
  color: #493078;
  box-sizing: border-box;
}

.search-container input:focus {
  border-color: #7950ae;
}

.search-icon {
  position: absolute;
  top: 7px;
  left: 12px;
  color: #9a87ad;
  font-size: 24px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

thead {
  background: #faf7fd;
}

th {
  padding: 16px 20px;
  color: #7c6695;
  font-size: 11px;
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  padding: 18px 20px;
  border-top: 1px solid #f1ebf6;
  color: #665675;
  font-size: 13px;
}

.id-cell {
  color: #a18caf;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 11px;
}

.avatar {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #eee5f8;
  color: #7950ae;
  font-weight: 700;
}

.user-name {
  color: #493078;
  font-weight: 700;
}

.role-badge {
  display: inline-block;
  padding: 7px 11px;
  border-radius: 8px;
  background: #f0eefb;
  color: #7765a6;
  font-size: 11px;
  font-weight: 700;
}

.role-admin {
  background: #eee5fa;
  color: #754ba8;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

.status-badge.active {
  background: #e7f7ef;
  color: #249461;
}

.status-badge.inactive {
  background: #f5edf0;
  color: #bb6d83;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

/* Centrar los botones de la columna Acciones */
.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

/* Centrar el encabezado y las celdas de Acciones */
table th:last-child,
table td:last-child {
  text-align: center;
}

.btn-edit,
.btn-status {
  padding: 8px 11px;
  border: none;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.btn-edit {
  background: #f0e9f8;
  color: #7950ae;
}

.btn-status.deactivate {
  background: #fff0f0;
  color: #c36b7c;
}

.btn-status.activate {
  background: #e7f7ef;
  color: #249461;
}

.table-footer {
  padding: 17px 25px;
  border-top: 1px solid #f1ebf6;
  color: #9b8aaa;
  font-size: 12px;
}

.empty-state {
  padding: 40px 20px;
  color: #9b8aaa;
  text-align: center;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-header,
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .search-container {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .usuarios-page {
    padding: 18px;
  }

  .page-header h1 {
    font-size: 23px;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}

/* ============================================
   MODALES PERSONALIZADOS DE USUARIOS
============================================ */

.usuario-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(31, 19, 51, 0.58);
  box-sizing: border-box;
}

.usuario-dialog {
  width: 100%;
  max-width: 450px;
  padding: 32px;
  border: 1px solid #eee6f5;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 20px 70px rgba(31, 19, 51, 0.25);
  text-align: center;
  box-sizing: border-box;
}

.usuario-dialog-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin: 0 auto 18px;
  border-radius: 18px;
  background: #f1e9fb;
  color: #7950ae;
  font-size: 30px;
  font-weight: 700;
}

.usuario-dialog h2 {
  margin: 0 0 14px;
  color: #352057;
  font-size: 22px;
}

.usuario-dialog p {
  margin: 0 0 15px;
  color: #665675;
  font-size: 14px;
  line-height: 1.7;
}

.usuario-dialog-detail {
  color: #9685a6 !important;
  font-size: 12px !important;
}

.usuario-dialog-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 26px;
}

.usuario-dialog-cancel,
.usuario-dialog-primary {
  padding: 12px 19px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.usuario-dialog-cancel {
  border: 1px solid #e5d9f0;
  background: #fff;
  color: #7950ae;
}

.usuario-dialog-primary {
  border: none;
  background: #7950ae;
  color: #fff;
}

.usuario-dialog-primary:hover {
  background: #633e96;
}

.usuario-dialog-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .usuario-dialog {
    padding: 24px 18px;
  }

  .usuario-dialog-actions {
    flex-direction: column;
  }
}
</style>
