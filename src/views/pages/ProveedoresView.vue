<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Importamos el formulario de proveedores.
import ProveedorModal from '../../components/ProveedorModal.vue'

import { apiGet, apiPost, apiPut, apiPatch } from '@/services/api'

// Estructura de los datos de un proveedor.
interface Proveedor {
  proveedorId: number
  nombre: string
  nit: string
  telefono: string
  correo: string
  direccion: string
  activo: boolean
}

// Estructura de los datos recibidos desde el formulario.
interface ProveedorFormulario {
  proveedorId?: number
  nombre: string
  nit: string
  telefono: string
  correo: string
  direccion: string
  activo: boolean
}

// --------------------------------------------------
// DATOS DE DEMOSTRACIÓN
// --------------------------------------------------
// Estos registros son temporales.
// Posteriormente se reemplazarán por los datos
// obtenidos desde la API de ASP.NET Core.
// --------------------------------------------------

// Lista de proveedores obtenidos desde SQL Server.
const proveedores = ref<Proveedor[]>([])

// =============================================
// PERMISOS DEL USUARIO AUTENTICADO
// =============================================

// Recuperar la información del usuario que inició sesión.
const usuarioGuardado = sessionStorage.getItem('sicop_usuario')

// Obtener el rol del usuario autenticado.
// Obtener el identificador del rol del usuario autenticado.
const rolUsuario = usuarioGuardado
  ? Number(JSON.parse(usuarioGuardado).rolId)
  : null

// Rol 1: Administrador General.
const esAdministradorGeneral = rolUsuario === 1

// Consulta los proveedores registrados en el backend.
async function cargarProveedores() {
  try {
    proveedores.value = await apiGet<Proveedor[]>('/api/Proveedores')
  } catch (error) {
    console.error('Error al consultar proveedores:', error)
  }
}

// Ejecuta la consulta al ingresar al módulo.
onMounted(() => {
  cargarProveedores()
})


// --------------------------------------------------
// BUSCADOR DE PROVEEDORES
// --------------------------------------------------

// Texto ingresado en el buscador.
const busqueda = ref('')

// Filtrar proveedores por nombre o NIT.
const proveedoresFiltrados = computed(() => {
  const texto = busqueda.value.toLowerCase().trim()

  return proveedores.value.filter((proveedor) => {
    return (
      proveedor.nombre.toLowerCase().includes(texto) ||
      proveedor.nit.toLowerCase().includes(texto)
    )
  })
})

// --------------------------------------------------
// CONTROL DEL FORMULARIO MODAL
// --------------------------------------------------

// Indica si la ventana del formulario está abierta.
const mostrarModal = ref(false)

// Guarda el proveedor que se desea editar.
const proveedorSeleccionado = ref<Proveedor | null>(null)

// Abrir formulario para registrar un proveedor.
function nuevoProveedor() {
  proveedorSeleccionado.value = null
  mostrarModal.value = true
}

// Abrir formulario para editar un proveedor.
function editarProveedor(proveedor: Proveedor) {

  // Impedir editar proveedores inactivos.
  if (!proveedor.activo) return

  // Cargar los datos del proveedor seleccionado.
  proveedorSeleccionado.value = { ...proveedor }

  // Abrir el formulario de edición.
  mostrarModal.value = true
}

// Cerrar el formulario.
function cerrarModal() {
  mostrarModal.value = false
  proveedorSeleccionado.value = null
}


// --------------------------------------------------
// GUARDAR PROVEEDOR
// --------------------------------------------------
async function guardarProveedor(datos: ProveedorFormulario) {
  try {
    // Campos permitidos por los DTOs del backend.
    const proveedorDatos = {
      nombre: datos.nombre,
      nit: datos.nit,
      telefono: datos.telefono,
      correo: datos.correo,
      direccion: datos.direccion,
    }

    if (datos.proveedorId !== undefined) {

      // PUT: actualizar proveedor en SQL Server.
      await apiPut<void>(
        `/api/Proveedores/${datos.proveedorId}`,
        proveedorDatos
      )

    } else {

      // POST: registrar proveedor en SQL Server.
      await apiPost<Proveedor>(
        '/api/Proveedores',
        proveedorDatos
      )
    }

    // Actualizar la tabla con los datos reales.
    await cargarProveedores()

    // Cerrar el formulario después de guardar.
    cerrarModal()

  } catch (error) {
    console.error('Error al guardar proveedor:', error)
    alert('No fue posible guardar el proveedor.')
  }
}


 // ==============================================
 // ACTIVAR Y DESACTIVAR PROVEEDORES
 // ==============================================

 // Controla la ventana de confirmación.
const mostrarConfirmacion = ref(false)

// Proveedor al que se cambiará el estado.
const proveedorCambioEstado = ref<Proveedor | null>(null)

// Abre la confirmación para activar o desactivar.
function confirmarCambioEstado(proveedor: Proveedor) {
  proveedorCambioEstado.value = proveedor
  mostrarConfirmacion.value = true
}

// Cierra la ventana sin realizar cambios.
function cancelarCambioEstado() {
  mostrarConfirmacion.value = false
  proveedorCambioEstado.value = null
}

// Cambia el estado del proveedor seleccionado.
// Por ahora, únicamente modifica los datos temporales.

async function cambiarEstadoProveedor() {

  // Obtener el proveedor seleccionado.
  const seleccionado = proveedorCambioEstado.value

  if (!seleccionado) return

  try {

    // Determinar si corresponde activar o desactivar.
    const accion = seleccionado.activo
      ? 'desactivar'
      : 'activar'

    // PATCH: guardar el cambio en SQL Server.
    await apiPatch(
      `/api/Proveedores/${seleccionado.proveedorId}/${accion}`
    )

    // Consultar nuevamente los proveedores reales.
    await cargarProveedores()

    // Cerrar la ventana de confirmación.
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

    <!-- ====================================== -->
    <!-- ENCABEZADO DEL MÓDULO                 -->
    <!-- ====================================== -->

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

      <!-- Botón para abrir el formulario -->
      <button
        class="btn-primary"
        type="button"
        @click="nuevoProveedor"
      >
        <span>＋</span>
        Nuevo proveedor
      </button>
    </header>

    <!-- ====================================== -->
    <!-- CONTENEDOR PRINCIPAL                  -->
    <!-- ====================================== -->

    <section class="table-card">

      <!-- Encabezado de la tabla -->
      <div class="table-header">
        <div>
          <h2>Proveedores registrados</h2>

          <p>
            Información de los proveedores del sistema.
          </p>
        </div>

        <!-- Contador de proveedores -->
        <span class="total-badge">
          {{ proveedores.length }} proveedores
        </span>
      </div>

      <!-- ====================================== -->
      <!-- BUSCADOR                              -->
      <!-- ====================================== -->

      <div class="search-container">
        <span class="search-icon">⌕</span>

        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por nombre o NIT..."
          aria-label="Buscar proveedores"
        />
      </div>

      <!-- ====================================== -->
      <!-- TABLA DE PROVEEDORES                  -->
      <!-- ====================================== -->

      <div class="table-responsive">
        <table>

          <!-- Encabezados de las columnas -->
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

          <!-- Registros -->
          <tbody>
            <tr
              v-for="proveedor in proveedoresFiltrados"
              :key="proveedor.proveedorId"
            >

              <!-- Identificador -->
              <td>
                #{{ proveedor.proveedorId }}
              </td>

              <!-- Nombre -->
              <td class="provider-name">
                {{ proveedor.nombre }}
              </td>

              <!-- NIT -->
              <td>
                {{ proveedor.nit }}
              </td>

              <!-- Teléfono -->
              <td>
                {{ proveedor.telefono || '—' }}
              </td>

              <!-- Correo electrónico -->
              <td>
                {{ proveedor.correo || '—' }}
              </td>

              <!-- Estado del proveedor -->
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

              <!-- Botones de acciones -->
              <td>
                <div class="actions-container">

                  <!-- Editar proveedor -->
                  <button
                    class="btn-edit"
                    type="button"
                    :disabled="!proveedor.activo"
                    @click="editarProveedor(proveedor)"
                  >
                    ✎ Editar
                  </button>

                  

<!-- Activar o desactivar: solo Administrador General -->
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

            <!-- Mensaje cuando no hay resultados -->
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

    </section>

    <!-- ====================================== -->
    <!-- FORMULARIO MODAL                       -->
    <!-- ====================================== -->
    <!-- Este componente fue creado previamente -->
    <!-- en src/components/ProveedorModal.vue   -->

    <ProveedorModal
      :visible="mostrarModal"
      :proveedor="proveedorSeleccionado"
      @cerrar="cerrarModal"
      @guardar="guardarProveedor"
    />

<!-- ====================================== -->
<!-- CONFIRMACIÓN DE CAMBIO DE ESTADO      -->
<!-- ====================================== -->

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
    <!-- Icono -->
    <div class="confirmation-icon">
      ?
    </div>

    <!-- Título -->
    <h2 id="confirmation-title">
      {{
        proveedorCambioEstado.activo
          ? '¿Desactivar proveedor?'
          : '¿Activar proveedor?'
      }}
    </h2>

    <!-- Mensaje -->
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

    <!-- Botones -->
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

  /* =========================================
    PROVEEDORES - BOTÓN EDITAR DESHABILITADO
    ========================================= */

  /* Indica visualmente que no se puede editar. */
  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* Evita efectos de interacción al pasar el mouse. */
  button:disabled:hover {
    transform: none;
  }

/* ========================================= */
/* CONTENEDOR GENERAL                       */
/* ========================================= */

.proveedores-page {
  min-height: 100%;
  padding: 42px;
  background: #f8f5fc;
  font-family: Arial, sans-serif;
}

/* ========================================= */
/* ENCABEZADO PRINCIPAL                     */
/* ========================================= */

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

/* ========================================= */
/* BOTÓN NUEVO PROVEEDOR                    */
/* ========================================= */

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

/* ========================================= */
/* CONTENEDOR DE LA TABLA                   */
/* ========================================= */

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

/* ========================================= */
/* BUSCADOR                                 */
/* ========================================= */

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

/* ========================================= */
/* TABLA                                    */
/* ========================================= */

/* Permite desplazamiento horizontal si la tabla es ancha */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

/* Evita que las columnas se compriman demasiado */
.table-responsive table {
  width: 100%;
  min-width: 1050px;
  border-collapse: collapse;
}

/* Mantiene el NIT y teléfono en una sola línea */
.table-responsive td:nth-child(3),
.table-responsive td:nth-child(4) {
  white-space: nowrap;
}

/* Centrar los botones Editar, Activar y Desactivar */
.actions-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

/* Centrar la última columna de la tabla */
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

/* Nombre del proveedor */
.provider-name {
  font-weight: 700;
  color: #352057;

  /* Evita que el nombre se divida en varias líneas */
  white-space: nowrap;
}

/* ========================================= */
/* ESTADO DEL PROVEEDOR                     */
/* ========================================= */

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

/* ========================================= */
/* BOTONES DE ACCIONES                      */
/* ========================================= */

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

/* ========================================= */
/* SIN REGISTROS                            */
/* ========================================= */

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

/* ========================================= */
/* PANTALLAS PEQUEÑAS                       */
/* ========================================= */

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

/* ========================================= */
/* BOTONES ACTIVAR Y DESACTIVAR              */
/* ========================================= */

.btn-status {
  border: none;
  padding: 9px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

/* Desactivar */
.btn-deactivate {
  background: #fcebed;
  color: #b54c5b;
}

.btn-deactivate:hover {
  background: #f8dce0;
}

/* Activar */
.btn-activate {
  background: #e9f7ee;
  color: #27834b;
}

.btn-activate:hover {
  background: #d5efde;
}

/* ========================================= */
/* FONDO DE LA VENTANA DE CONFIRMACIÓN       */
/* ========================================= */

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

/* Ventana */
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

/* Icono */
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

/* Título */
.confirmation-card h2 {
  margin-bottom: 15px;
  color: #352057;
  font-size: 23px;
}

/* Mensajes */
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

/* Botones */
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

</style>