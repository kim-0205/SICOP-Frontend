
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ProveedorModal from '../../components/ProveedorModal.vue'
import { apiGet, apiPost, apiPut, apiPatch } from '@/services/api'

interface Proveedor {
  proveedorId: number
  nombre: string
  nit: string
  telefono: string
  correo: string
  direccion: string
  activo: boolean
}

interface ProveedorFormulario {
  proveedorId?: number
  nombre: string
  nit: string
  telefono: string
  correo: string
  direccion: string
  activo: boolean
}

const proveedores = ref<Proveedor[]>([])

const usuarioGuardado = sessionStorage.getItem('sicop_usuario')

const rolUsuario = usuarioGuardado
  ? Number(JSON.parse(usuarioGuardado).rolId)
  : null

const esAdministradorGeneral = rolUsuario === 1

async function cargarProveedores() {
  try {
    proveedores.value = await apiGet<Proveedor[]>('/api/Proveedores')
  } catch (error) {
    console.error('Error al consultar proveedores:', error)
  }
}

onMounted(() => {
  cargarProveedores()
})

const busqueda = ref('')

const proveedoresFiltrados = computed(() => {
  const texto = busqueda.value.toLowerCase().trim()

  return proveedores.value.filter((proveedor) => {
    return (
      proveedor.nombre.toLowerCase().includes(texto) ||
      proveedor.nit.toLowerCase().includes(texto)
    )
  })
})

const registrosPorPagina = 5
const paginaActual = ref(1)

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(proveedoresFiltrados.value.length / registrosPorPagina))
)

const proveedoresPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * registrosPorPagina

  return proveedoresFiltrados.value.slice(
    inicio,
    inicio + registrosPorPagina
  )
})

function cambiarPagina(pagina: number) {
  if (pagina >= 1 && pagina <= totalPaginas.value) {
    paginaActual.value = pagina
  }
}

watch(busqueda, () => {
  paginaActual.value = 1
})

watch(totalPaginas, (total) => {
  if (paginaActual.value > total) {
    paginaActual.value = total
  }
})

const mostrarModal = ref(false)
const proveedorSeleccionado = ref<Proveedor | null>(null)

function nuevoProveedor() {
  proveedorSeleccionado.value = null
  mostrarModal.value = true
}

function editarProveedor(proveedor: Proveedor) {
  if (!proveedor.activo) return

  proveedorSeleccionado.value = { ...proveedor }
  mostrarModal.value = true
}

function cerrarModal() {
  mostrarModal.value = false
  proveedorSeleccionado.value = null
}

async function guardarProveedor(datos: ProveedorFormulario) {
  try {
    const proveedorDatos = {
      nombre: datos.nombre,
      nit: datos.nit,
      telefono: datos.telefono,
      correo: datos.correo,
      direccion: datos.direccion,
    }

    if (datos.proveedorId !== undefined) {
      await apiPut<void>(
        `/api/Proveedores/${datos.proveedorId}`,
        proveedorDatos
      )
    } else {
      await apiPost<Proveedor>(
        '/api/Proveedores',
        proveedorDatos
      )
    }

    await cargarProveedores()
    cerrarModal()

  } catch (error) {
    console.error('Error al guardar proveedor:', error)
    alert('No fue posible guardar el proveedor.')
  }
}

const mostrarConfirmacion = ref(false)
const proveedorCambioEstado = ref<Proveedor | null>(null)

function confirmarCambioEstado(proveedor: Proveedor) {
  proveedorCambioEstado.value = proveedor
  mostrarConfirmacion.value = true
}

function cancelarCambioEstado() {
  mostrarConfirmacion.value = false
  proveedorCambioEstado.value = null
}

async function cambiarEstadoProveedor() {
  const seleccionado = proveedorCambioEstado.value

  if (!seleccionado) return

  try {
    const accion = seleccionado.activo
      ? 'desactivar'
      : 'activar'

    await apiPatch(
      `/api/Proveedores/${seleccionado.proveedorId}/${accion}`
    )

    await cargarProveedores()
    cancelarCambioEstado()

  } catch (error) {
    console.error('Error al cambiar el estado del proveedor:', error)

    alert(
      'No fue posible cambiar el estado del proveedor. ' +
      'Verifica que tengas permisos de Administrador General.'
    )
  }
}
</script>

<template>
  <main class="proveedores-page">
    <header class="page-header">
      <div>
        <span class="page-label">
          ADMINISTRACIÓN
        </span>

        <h1>Gestión de proveedores</h1>

        <p>
          Consulta y administra los proveedores
          registrados en SICOP.
        </p>
      </div>

      <button
        class="btn-primary"
        type="button"
        @click="nuevoProveedor"
      >
        <span>＋</span>
        Nuevo proveedor
      </button>
    </header>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Proveedores registrados</h2>

          <p>
            Información de los proveedores del sistema.
          </p>
        </div>

        <span class="total-badge">
          {{ proveedores.length }} proveedores
        </span>
      </div>

      <div class="search-container">
        <span class="search-icon">⌕</span>

        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por nombre o NIT..."
          aria-label="Buscar proveedores"
        />
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Proveedor</th>
              <th>NIT</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="proveedor in proveedoresPaginados"
              :key="proveedor.proveedorId"
            >
              <td>
                #{{ proveedor.proveedorId }}
              </td>

              <td class="provider-name">
                {{ proveedor.nombre }}
              </td>

              <td>
                {{ proveedor.nit }}
              </td>

              <td>
                {{ proveedor.telefono || '—' }}
              </td>

              <td>
                {{ proveedor.correo || '—' }}
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="
                    proveedor.activo
                      ? 'active'
                      : 'inactive'
                  "
                >
                  {{
                    proveedor.activo
                      ? 'Activo'
                      : 'Inactivo'
                  }}
                </span>
              </td>

              <td>
                <div class="actions-container">
                  <button
                    class="btn-edit"
                    type="button"
                    :disabled="!proveedor.activo"
                    @click="editarProveedor(proveedor)"
                  >
                    ✎ Editar
                  </button>

                  <button
                    v-if="esAdministradorGeneral"
                    type="button"
                    class="btn-status"
                    :class="proveedor.activo ? 'btn-deactivate' : 'btn-activate'"
                    @click="confirmarCambioEstado(proveedor)"
                  >
                    {{ proveedor.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="proveedoresFiltrados.length === 0">
              <td colspan="7" class="empty-state">
                <div class="empty-icon">
                  ▤
                </div>

                <h3>Sin proveedores disponibles</h3>

                <p>
                  No se encontraron proveedores
                  para mostrar.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="proveedoresFiltrados.length > 0"
        class="pagination-container"
      >
        <span class="pagination-info">
          Mostrando
          {{ (paginaActual - 1) * registrosPorPagina + 1 }}
          -
          {{ Math.min(paginaActual * registrosPorPagina, proveedoresFiltrados.length) }}
          de {{ proveedoresFiltrados.length }} proveedores
        </span>

        <div class="pagination-buttons">
          <button
            type="button"
            class="pagination-btn"
            :disabled="paginaActual === 1"
            @click="cambiarPagina(paginaActual - 1)"
          >
            ‹ Anterior
          </button>

          <span class="pagination-current">
            Página {{ paginaActual }} de {{ totalPaginas }}
          </span>

          <button
            type="button"
            class="pagination-btn"
            :disabled="paginaActual === totalPaginas"
            @click="cambiarPagina(paginaActual + 1)"
          >
            Siguiente ›
          </button>
        </div>
      </div>
    </section>

    <ProveedorModal
      :visible="mostrarModal"
      :proveedor="proveedorSeleccionado"
      @cerrar="cerrarModal"
      @guardar="guardarProveedor"
    />

    <div
      v-if="mostrarConfirmacion && proveedorCambioEstado"
      class="confirmation-overlay"
      @click.self="cancelarCambioEstado"
    >
      <section
        class="confirmation-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
      >
        <div class="confirmation-icon">
          ?
        </div>

        <h2 id="confirmation-title">
          {{
            proveedorCambioEstado.activo
              ? '¿Desactivar proveedor?'
              : '¿Activar proveedor?'
          }}
        </h2>

        <p id="confirmation-description">
          Estás a punto de
          {{
            proveedorCambioEstado.activo
              ? 'desactivar'
              : 'activar'
          }}
          al proveedor
          <strong>{{ proveedorCambioEstado.nombre }}</strong>.
        </p>

        <p class="confirmation-note">
          Esta acción podrá revertirse posteriormente.
        </p>

        <div class="confirmation-actions">
          <button
            type="button"
            class="btn-confirm-cancel"
            @click="cancelarCambioEstado"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="btn-confirm-action"
            @click="cambiarEstadoProveedor"
          >
            {{
              proveedorCambioEstado.activo
                ? 'Sí, desactivar'
                : 'Sí, activar'
            }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

button:disabled:hover {
  transform: none;
}

.proveedores-page {
  min-height: 100%;
  padding: 42px;
  background: #f8f5fc;
  font-family: Arial, sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 35px;
}

.page-label {
  color: #9069b6;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

.page-header h1 {
  margin: 12px 0;
  color: #352057;
  font-size: 34px;
  font-weight: 750;
}

.page-header p {
  color: #917ca9;
  font-size: 15px;
}

.btn-primary {
  border: none;
  border-radius: 12px;
  background: #7950ae;
  color: white;
  padding: 15px 24px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #633e96;
}

.table-card {
  background: #ffffff;
  border: 1px solid #ebe3f5;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 30px rgba(71, 43, 109, 0.03);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
}

.table-header h2 {
  color: #352057;
  font-size: 21px;
  margin: 0 0 10px;
}

.table-header p {
  color: #9a87ae;
  font-size: 14px;
  margin: 0;
}

.total-badge {
  padding: 10px 16px;
  background: #f0e8f8;
  color: #7950ae;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  height: 52px;
  border: 1px solid #e7ddf2;
  border-radius: 12px;
  margin-bottom: 25px;
  background: #fcfaff;
}

.search-icon {
  color: #7950ae;
  font-size: 25px;
}

.search-container input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #352057;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.table-responsive table {
  width: 100%;
  min-width: 1050px;
  border-collapse: collapse;
}

.table-responsive td:nth-child(3),
.table-responsive td:nth-child(4) {
  white-space: nowrap;
}

.actions-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

table th:last-child,
table td:last-child {
  text-align: center;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

thead {
  background: #f7f2fc;
}

th {
  padding: 18px;
  color: #72558f;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

td {
  padding: 19px 18px;
  color: #716080;
  font-size: 13px;
  border-bottom: 1px solid #f0eaf6;
}

.provider-name {
  font-weight: 700;
  color: #352057;
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 8px 13px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.active {
  background: #e9f7ee;
  color: #27834b;
}

.inactive {
  background: #fcebed;
  color: #b54c5b;
}

.btn-edit {
  border: 1px solid #e5d9f0;
  background: #f3ecfa;
  color: #7950ae;
  padding: 9px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-edit:hover {
  background: #e8d9f5;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 45px;
  color: #b99bdb;
  margin-bottom: 15px;
}

.empty-state h3 {
  color: #493078;
  font-size: 18px;
}

.empty-state p {
  color: #a18fb4;
  font-size: 14px;
}

@media (max-width: 768px) {
  .proveedores-page {
    padding: 20px;
  }

  .page-header,
  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .table-card {
    padding: 18px;
  }

  .btn-primary {
    width: 100%;
  }
}

.btn-status {
  border: none;
  padding: 9px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-deactivate {
  background: #fcebed;
  color: #b54c5b;
}

.btn-deactivate:hover {
  background: #f8dce0;
}

.btn-activate {
  background: #e9f7ee;
  color: #27834b;
}

.btn-activate:hover {
  background: #d5efde;
}

.confirmation-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(35, 20, 59, 0.55);
  backdrop-filter: blur(5px);
}

.confirmation-card {
  width: 100%;
  max-width: 440px;
  box-sizing: border-box;
  background: white;
  border-radius: 22px;
  padding: 35px;
  text-align: center;
  box-shadow: 0 24px 70px rgba(45, 25, 75, 0.2);
}

.confirmation-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 65px;
  height: 65px;
  margin: 0 auto 20px;
  border-radius: 20px;
  background: #f1e9f9;
  color: #7950ae;
  font-size: 30px;
  font-weight: bold;
}

.confirmation-card h2 {
  margin-bottom: 15px;
  color: #352057;
  font-size: 23px;
}

.confirmation-card p {
  color: #826d99;
  font-size: 14px;
  line-height: 1.7;
}

.confirmation-card strong {
  color: #493078;
}

.confirmation-note {
  font-size: 12px !important;
  color: #a18fb4 !important;
}

.confirmation-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 28px;
}

.btn-confirm-cancel,
.btn-confirm-action {
  flex: 1;
  border-radius: 11px;
  padding: 13px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-confirm-cancel {
  border: 1px solid #e5d9f0;
  background: white;
  color: #7950ae;
}

.btn-confirm-action {
  border: none;
  background: #7950ae;
  color: white;
}

.btn-confirm-action:hover {
  background: #633e96;
}

@media (max-width: 480px) {
  .confirmation-card {
    padding: 25px;
  }

  .confirmation-actions {
    flex-direction: column;
  }
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebe3f5;
}

.pagination-info {
  font-size: 13px;
  color: #826d99;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-btn {
  padding: 10px 16px;
  border: 1px solid #e5d9f0;
  border-radius: 9px;
  background: #f3ecfa;
  color: #7950ae;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.pagination-btn:hover:not(:disabled) {
  background: #e8d9f5;
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination-current {
  font-size: 13px;
  font-weight: 600;
  color: #493078;
}

@media (max-width: 600px) {
  .pagination-container {
    flex-direction: column;
    align-items: center;
  }

  .pagination-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
