<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiPost, apiPut } from '@/services/api'
import FacturaModal from '../../components/FacturaModal.vue'

// Obtener el rol del usuario autenticado.
const usuarioGuardado = sessionStorage.getItem('sicop_usuario')

const rolUsuario = usuarioGuardado
  ? JSON.parse(usuarioGuardado).rolId
  : null

// Solo el Administrador General puede anular facturas.
// En SICOP, el Administrador General tiene rolId = 1.
const esAdministradorGeneral = Number(rolUsuario) === 1

// Datos compartidos con el futuro módulo Pagos.
// Este almacenamiento es temporal; aún no utiliza el backend.
import {
  facturas,
  proveedores,
  cargarProveedoresFacturas,
  cargarFacturas,
  formatoMoneda,
  formatoFecha,
  totalFacturas,
  montoTotalFacturado,
  saldoTotalPendiente,
  totalFacturasPagadas,
  type FacturaCompra,
  type FacturaFormulario
} from '../../stores/sicopStore'


// Buscar por número de factura o nombre del proveedor.
const busqueda = ref('')
const facturasFiltradas = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return facturas.value.filter(factura =>
    factura.numeroFactura.toLowerCase().includes(texto) ||
    factura.nombreProveedor.toLowerCase().includes(texto)
  )
})

// Factura seleccionada para anulación.
const facturaParaAnular = ref<FacturaCompra | null>(null)

// Abrir la confirmación de anulación.
function confirmarAnulacion(factura: FacturaCompra): void {
  if (!esAdministradorGeneral || factura.anulada) return

  facturaParaAnular.value = factura
}

// AQUÍ COMIENZA EL NUEVO CÓDIGO.

// Motivo obligatorio para anular una factura.
const motivoAnulacion = ref('')

// Indica si se está procesando la anulación.
const anulandoFactura = ref(false)

// Cerrar la confirmación.
function cancelarAnulacion(): void {
  if (anulandoFactura.value) return

  facturaParaAnular.value = null
  motivoAnulacion.value = ''
}

// Confirmar la anulación en SQL Server.
async function anularFactura(): Promise<void> {
  const factura = facturaParaAnular.value
  const motivo = motivoAnulacion.value.trim()

  if (!factura || !esAdministradorGeneral || factura.anulada) return

  if (!motivo || motivo.length > 500) {
    alert('Ingrese un motivo de anulación de máximo 500 caracteres.')
    return
  }

  anulandoFactura.value = true

  try {
    // Enviar el motivo al backend.
    await apiPut<void>(
      `/api/FacturasCompras/${factura.facturaCompraId}/anular`,
      motivo
    )

    // Actualizar las facturas desde SQL Server.
    await cargarFacturas()

    // Cerrar la confirmación.
    facturaParaAnular.value = null
    motivoAnulacion.value = ''

  } catch (error) {
    console.error('Error al anular la factura:', error)

    alert(
      error instanceof Error
        ? error.message
        : 'No fue posible anular la factura.'
    )
  } finally {
    anulandoFactura.value = false
  }
}

// =============================================
// CARGAR DATOS REALES DESDE SQL SERVER
// =============================================

onMounted(async () => {
  try {
    // Primero cargar los proveedores reales.
    await cargarProveedoresFacturas()

    // Después cargar las facturas y sus saldos.
    await cargarFacturas()

  } catch (error) {
    console.error('Error al cargar las facturas:', error)
    alert('No fue posible consultar las facturas desde el servidor.')
  }
})

// Solo proveedores activos para registrar facturas nuevas.
const proveedoresActivos = computed(() =>
  proveedores.value.filter(proveedor => proveedor.activo)
)

// Control del formulario de nueva factura.
const mostrarModal = ref(false)
const facturaSeleccionada = ref<FacturaFormulario | null>(null)

// ==============================================
// MODAL DE ERROR AL REGISTRAR FACTURA
// ==============================================

// Controla la visibilidad del mensaje de error.
const mostrarModalError = ref(false)

// Mensaje que se mostrará al usuario.
const mensajeErrorFactura = ref('')

// Cerrar únicamente el mensaje de error.
function cerrarModalError() {
  mostrarModalError.value = false
  mensajeErrorFactura.value = ''
}

function nuevaFactura() {
  facturaSeleccionada.value = null
  mostrarModal.value = true
}

function editarFactura(factura: FacturaCompra) {
  facturaSeleccionada.value = {
    facturaCompraId: factura.facturaCompraId,
    proveedorId: factura.proveedorId,
    numeroFactura: factura.numeroFactura,
    fechaEmision: factura.fechaEmision,
    fechaVencimiento: factura.fechaVencimiento,
    total: factura.total,
    observaciones: factura.observaciones
  }
  mostrarModal.value = true
}

function cerrarModal() {
  mostrarModal.value = false
  facturaSeleccionada.value = null
}


 // Registrar una factura real en SQL Server.
 async function guardarFactura(datos: FacturaFormulario): Promise<void> {
   try {

     // El backend no permite editar facturas registradas.
     if (datos.facturaCompraId !== undefined) {
       alert('Las facturas registradas no pueden editarse.')
       return
     }

     // Preparar los datos que recibe CrearFacturaCompraDto.
     const nuevaFactura = {
       proveedorId: datos.proveedorId,
       numeroFactura: datos.numeroFactura.trim(),
       fechaEmision: datos.fechaEmision,
       fechaVencimiento: datos.fechaVencimiento,
       total: datos.total,
       observaciones: datos.observaciones
     }

     // Guardar la factura mediante POST.
     await apiPost<FacturaCompra>(
       '/api/FacturasCompras',
       nuevaFactura
     )

     // Actualizar la tabla y los indicadores desde SQL Server.
     await cargarFacturas()

     // Cerrar el formulario solamente si todo salió bien.
     cerrarModal()

   }  catch (error) {
  console.error('Error al registrar la factura:', error)

  const mensaje = error instanceof Error
    ? error.message
    : 'No fue posible registrar la factura.'

  // Mostrar un mensaje cuando el número de factura ya existe en SICOP.
  if (mensaje.includes('409')) {
    mensajeErrorFactura.value =
      'Ya existe una factura registrada con este número en SICOP. No se permiten números de factura duplicados.'
  } else {
    // Conservar el mensaje original para otros errores.
    mensajeErrorFactura.value = mensaje
  }

  mostrarModalError.value = true
}
 }
 

// Mostrar el estado real de la factura.
function obtenerEstado(factura: FacturaCompra): string {

  // La anulación tiene prioridad sobre el saldo.
  if (factura.anulada) return 'Anulada'

  if (factura.saldoPendiente <= 0) return 'Pagada'

  if (factura.saldoPendiente < factura.total) {
    return 'Parcialmente pagada'
  }

  return 'Pendiente'
}

// Asignar el estilo correspondiente al estado.
function claseEstado(factura: FacturaCompra): string {

  if (factura.anulada) return 'cancelled'

  if (factura.saldoPendiente <= 0) return 'paid'

  if (factura.saldoPendiente < factura.total) {
    return 'partial'
  }

  return 'pending'
}

</script>

<template>
  <main class="facturas-page">
    <!-- Encabezado -->
    <header class="page-header">
      <div>
        <span class="page-label">CUENTAS POR PAGAR</span>
        <h1>Facturas de compra</h1>
        <p>Consulta y administra las facturas registradas en SICOP.</p>
      </div>
      <button type="button" class="btn-primary" @click="nuevaFactura">
        <span>＋</span> Nueva factura
      </button>
    </header>

    <!-- Indicadores -->
    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">Facturas registradas</span>
        <strong>{{ totalFacturas }}</strong>
        <p>Total de facturas del sistema</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">Monto facturado</span>
        <strong>{{ formatoMoneda(montoTotalFacturado) }}</strong>
        <p>Valor total de las compras</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">Saldo pendiente</span>
        <strong>{{ formatoMoneda(saldoTotalPendiente) }}</strong>
        <p>Monto que falta por pagar</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">Facturas pagadas</span>
        <strong>{{ totalFacturasPagadas }}</strong>
        <p>Facturas con saldo cancelado</p>
      </article>
    </section>

    <!-- Tabla -->
    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Facturas registradas</h2>
          <p>Información de las facturas de compra.</p>
        </div>
        <span class="total-badge">{{ facturas.length }} facturas</span>
      </div>

      <div class="search-container">
        <span class="search-icon">⌕</span>
        <input v-model="busqueda" type="search" placeholder="Buscar factura o proveedor..." aria-label="Buscar facturas" />
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>No. factura</th>
              <th>Proveedor</th>
              <th>Emisión</th>
              <th>Vencimiento</th>
              <th>Total</th>
              <th>Saldo pendiente</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- Mostrar un correlativo visual según el orden de las facturas -->
            <tr
              v-for="(factura, index) in facturasFiltradas":key="factura.facturaCompraId">
              <td>{{ index + 1 }}</td>
              <td class="invoice-number">{{ factura.numeroFactura }}</td>
              <td class="provider-name">{{ factura.nombreProveedor }}</td>
              <td>{{ formatoFecha(factura.fechaEmision) }}</td>
              <td>{{ formatoFecha(factura.fechaVencimiento) }}</td>
              <td class="money-cell">{{ formatoMoneda(factura.total) }}</td>
              <td class="money-cell">{{ formatoMoneda(factura.saldoPendiente) }}</td>
              <td><span class="status-badge" :class="claseEstado(factura)">{{ obtenerEstado(factura) }}</span></td>
              <!-- Columna de acciones centrada -->
<td class="acciones-factura">

              <!-- Botón para anular facturas activas -->
              <button
                v-if="esAdministradorGeneral && !factura.anulada"
                type="button"
                class="btn-edit"
                @click="confirmarAnulacion(factura)"
              >
                ✕ Anular
              </button>

              <!-- Etiqueta para facturas anuladas -->
              <span
                v-else-if="factura.anulada"
                class="factura-anulada-badge"
              >
                <span aria-hidden="true">⊗</span>
                Anulada
              </span>

            </td>
            </tr>
            <tr v-if="facturasFiltradas.length === 0">
              <td colspan="9" class="empty-state">
                <div class="empty-icon">▤</div>
                <h3>No se encontraron facturas</h3>
                <p>Intenta buscar con otro número de factura o proveedor.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Formulario de registro y edición -->
    <FacturaModal
      :visible="mostrarModal"
      :factura="facturaSeleccionada"
      :proveedores="proveedoresActivos"
      @cerrar="cerrarModal"
      @guardar="guardarFactura"
    />

    <!-- MODAL PERSONALIZADO DE ERROR AL REGISTRAR FACTURA -->
<div
  v-if="mostrarModalError"
  class="error-factura-overlay"
  @click.self="cerrarModalError"
>
  <section
    class="error-factura-modal"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="titulo-error-factura"
    aria-describedby="descripcion-error-factura"
  >
    <div class="error-factura-icon">!</div>

    <h2 id="titulo-error-factura">
      No se pudo registrar la factura
    </h2>

    <p id="descripcion-error-factura">
      {{ mensajeErrorFactura }}
    </p>

    <div class="error-factura-actions">
      <button
        type="button"
        class="error-factura-button"
        @click="cerrarModalError"
      >
        Entendido
      </button>
    </div>
  </section>
</div>
    <!-- Confirmación de anulación de factura -->
<div
  v-if="facturaParaAnular"
  class="anulacion-overlay"
>
  <div class="anulacion-modal">
    <h2>Anular factura</h2>

    <p>
      ¿Deseas anular la factura
      <strong>{{ facturaParaAnular.numeroFactura }}</strong>?
    </p>

    <p>
      Esta operación conservará el registro en el historial.
      No se permite anular facturas con pagos vigentes.
    </p>

    <label for="motivo-anulacion">
      Motivo de anulación
    </label>

    <textarea
      id="motivo-anulacion"
      v-model="motivoAnulacion"
      maxlength="500"
      rows="4"
      placeholder="Escribe el motivo de la anulación..."
      :disabled="anulandoFactura"
    ></textarea>

    <div class="anulacion-acciones">
      <button
        type="button"
        class="btn-cancelar-anulacion"
        :disabled="anulandoFactura"
        @click="cancelarAnulacion"
      >
        Cancelar
      </button>

      <button
        type="button"
        class="btn-confirmar-anulacion"
        :disabled="anulandoFactura || !motivoAnulacion.trim()"
        @click="anularFactura"
      >
        {{ anulandoFactura ? 'Anulando...' : 'Confirmar anulación' }}
      </button>
    </div>
  </div>
</div>
  </main>
</template>

<style scoped>
/* Contenedor principal */
.facturas-page {
  min-height: 100%;
  padding: 42px;
  background: #f8f5fc;
  font-family: Arial, sans-serif;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}
.page-label { color: #9069b6; font-size: 12px; font-weight: 700; letter-spacing: 2px; }
.page-header h1 { margin: 12px 0; color: #352057; font-size: 34px; }
.page-header p { color: #917ca9; font-size: 15px; }

/* Botón de registro */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 9px;
  border: none;
  border-radius: 12px;
  background: #7950ae;
  color: #fff;
  padding: 15px 24px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.btn-primary:hover { background: #633e96; }

/* Tarjetas de resumen */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 30px;
}
.summary-card {
  min-width: 0;
  padding: 25px;
  background: #fff;
  border: 1px solid #ebe3f5;
  border-radius: 18px;
  box-shadow: 0 8px 30px rgba(71, 43, 109, 0.03);
}
.summary-label { color: #927ca9; font-size: 13px; font-weight: 600; }
.summary-card strong {
  display: block;
  margin: 18px 0 10px;
  color: #352057;
  font-size: clamp(19px, 2vw, 26px);
  overflow-wrap: anywhere;
}
.summary-card p { margin: 0; color: #a18fb4; font-size: 12px; }

/* Contenedor de la tabla */
.table-card {
  background: #fff;
  border: 1px solid #ebe3f5;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 30px rgba(71, 43, 109, 0.03);
}
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 25px;
}
.table-header h2 { margin: 0 0 10px; color: #352057; font-size: 21px; }
.table-header p { margin: 0; color: #9a87ae; font-size: 14px; }
.total-badge {
  padding: 10px 16px;
  border-radius: 30px;
  background: #f0e8f8;
  color: #7950ae;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

/* Buscador */
.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 18px;
  margin-bottom: 25px;
  border: 1px solid #e7ddf2;
  border-radius: 12px;
  background: #fcfaff;
}
.search-icon { color: #7950ae; font-size: 25px; }
.search-container input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #352057;
  font-size: 14px;
}

/* Tabla con desplazamiento horizontal */
.table-responsive { width: 100%; overflow-x: auto; }
table { width: 100%; min-width: 1240px; border-collapse: collapse; text-align: left; }
thead { background: #f7f2fc; }
th {
  padding: 18px;
  color: #72558f;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
td {
  padding: 19px 18px;
  border-bottom: 1px solid #f0eaf6;
  color: #716080;
  font-size: 13px;
}
.invoice-number { color: #7950ae; font-weight: 700; white-space: nowrap; }
.provider-name { color: #352057; font-weight: 700; white-space: nowrap; }
.money-cell { white-space: nowrap; font-weight: 600; }

/* Estados */
.status-badge {
  display: inline-block;
  padding: 8px 13px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.pending { background: #fff3df; color: #a66a12; }
.partial { background: #eee9fb; color: #7550a9; }
.paid { background: #e9f7ee; color: #27834b; }

/* Estado de factura anulada */
.cancelled {
  background: #fde8e8;
  color: #b42318;
}

/* Botón editar */
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
}
.btn-edit:hover { background: #e8d9f5; }

/* Sin resultados */
.empty-state { padding: 70px 20px; text-align: center; }
.empty-icon { color: #b99bdb; font-size: 45px; }
.empty-state h3 { color: #493078; font-size: 18px; }
.empty-state p { color: #a18fb4; font-size: 14px; }

/* Adaptación a pantallas pequeñas */
@media (max-width: 1100px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .facturas-page { padding: 20px; }
  .page-header, .table-header { flex-direction: column; align-items: flex-start; }
  .page-header h1 { font-size: 26px; }
  .btn-primary { width: 100%; justify-content: center; }
  .table-card { padding: 18px; }
}
@media (max-width: 480px) {
  .summary-grid { grid-template-columns: 1fr; }
}

/* Fondo de la ventana de anulación */
.anulacion-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: rgba(35, 20, 55, 0.55);
}

/* Ventana de confirmación */
.anulacion-modal {
  width: 100%;
  max-width: 480px;
  padding: 30px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 15px 45px rgba(35, 20, 55, 0.2);
}

.anulacion-modal h2 {
  margin: 0 0 15px;
  color: #352057;
}

.anulacion-modal p {
  color: #716080;
  line-height: 1.6;
}

.anulacion-modal label {
  display: block;
  margin: 20px 0 10px;
  color: #493078;
  font-weight: 600;
}

.anulacion-modal textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  border: 1px solid #d9c9eb;
  border-radius: 10px;
  font: inherit;
  resize: vertical;
}

.anulacion-modal textarea:focus {
  outline: 2px solid #9069b6;
}

.anulacion-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancelar-anulacion,
.btn-confirmar-anulacion {
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancelar-anulacion {
  background: #eee9f5;
  color: #493078;
}

.btn-confirmar-anulacion {
  background: #7950ae;
  color: white;
}

.anulacion-acciones button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==============================================
   MODAL PERSONALIZADO DE ERROR DE FACTURA
   ============================================== */

.error-factura-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(35, 20, 55, 0.55);
}

.error-factura-modal {
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
  padding: 30px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 20px 60px rgba(35, 20, 55, 0.25);
}

.error-factura-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-bottom: 18px;
  border-radius: 15px;
  background: #f3ecfa;
  color: #7950ae;
  font-size: 26px;
  font-weight: 700;
}

.error-factura-modal h2 {
  margin: 0 0 12px;
  color: #352057;
  font-size: 22px;
}

.error-factura-modal p {
  color: #716080;
  font-size: 14px;
  line-height: 1.7;
}

.error-factura-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
}

.error-factura-button {
  border: none;
  border-radius: 10px;
  padding: 12px 22px;
  background: #7950ae;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.error-factura-button:hover {
  background: #633e96;
}

/* ============================================
   COLUMNA ACCIONES - FACTURAS
============================================ */

/* Centrar encabezado y contenido */
table th:last-child,
table td.acciones-factura {
  text-align: center;
}

/* Etiqueta para facturas anuladas */
.factura-anulada-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 8px 12px;
  border-radius: 9px;

  background: #fce8eb;
  color: #b44960;

  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
