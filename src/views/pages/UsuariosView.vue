
<script setup lang="ts">
import { computed, ref } from 'vue'
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

// Usuarios de ejemplo para desarrollar la interfaz.
const usuarios = ref<Usuario[]>([
  {
    usuarioId: 1,
    nombre: 'Administrador SICOP',
    correo: 'admin@sicop.com',
    rolId: 1,
    activo: true
  },
  {
    usuarioId: 2,
    nombre: 'Operador SICOP',
    correo: 'operador@sicop.com',
    rolId: 2,
    activo: true
  },
  {
    usuarioId: 3,
    nombre: 'María López',
    correo: 'maria@sicop.com',
    rolId: 2,
    activo: false
  }
])

// ============================================
// ESTADOS DE LA VISTA
// ============================================

const busqueda = ref('')
const mostrarModal = ref(false)
const usuarioSeleccionado = ref<Usuario | null>(null)

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

function guardarUsuario(datos: DatosUsuario) {
  const correoNormalizado = datos.correo.trim().toLowerCase()

  // Evita registrar correos duplicados.
  const correoExistente = usuarios.value.some(usuario =>
    usuario.correo.toLowerCase() === correoNormalizado &&
    usuario.usuarioId !== datos.usuarioId
  )

  if (correoExistente) {
    alert('Ya existe un usuario registrado con este correo.')
    return
  }

  // EDITAR USUARIO
  if (datos.usuarioId !== undefined) {
    const indice = usuarios.value.findIndex(
      usuario => usuario.usuarioId === datos.usuarioId
    )

    if (indice === -1) {
      alert('No se encontró el usuario seleccionado.')
      return
    }

    usuarios.value[indice] = {
      usuarioId: datos.usuarioId,
      nombre: datos.nombre,
      correo: correoNormalizado,
      rolId: datos.rolId,
      activo: datos.activo
    }

    cerrarModal()
    return
  }

  // REGISTRAR USUARIO
  // En esta etapa solo simulamos el registro.
  // La contraseña no se guarda en la lista ni
  // en almacenamiento local.
  if (!datos.password) {
    alert('Debe ingresar una contraseña.')
    return
  }

  const nuevoId =
    Math.max(0, ...usuarios.value.map(usuario => usuario.usuarioId)) + 1

  usuarios.value.push({
    usuarioId: nuevoId,
    nombre: datos.nombre,
    correo: correoNormalizado,
    rolId: datos.rolId,
    activo: datos.activo
  })

  cerrarModal()
}

// ============================================
// ACTIVAR / DESACTIVAR USUARIO
// ============================================

function cambiarEstado(usuario: Usuario) {
  const accion = usuario.activo ? 'desactivar' : 'activar'

  const confirmado = confirm(
    `¿Está seguro de que desea ${accion} a ${usuario.nombre}?`
  )

  if (!confirmado) return

  usuario.activo = !usuario.activo
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

            <tr v-if="usuariosFiltrados.length === 0">
              <td colspan="6" class="empty-state">
                No se encontraron usuarios con esa búsqueda.
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

.actions {
  display: flex;
  gap: 8px;
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
</style>
