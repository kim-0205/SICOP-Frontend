<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
// Servicios para registrar pagos en ASP.NET Core.
import { apiPost, apiPut } from '@/services/api'

import {
  facturas,
  pagos,
  formatoMoneda,
  formatoFecha,
  cargarPagos,
  cargarFacturas,
  cargarProveedoresFacturas,
  type PagoFormulario
} from '../../stores/sicopStore'

// Cargar información real al ingresar al módulo Pagos.
onMounted(async () => {
  try {

    // Primero cargar proveedores para identificar sus nombres.
    await cargarProveedoresFacturas()

    // Consultar facturas y sus saldos reales.
    await cargarFacturas()

    // Consultar el historial de pagos desde SQL Server.
    await cargarPagos()

  } catch (error) {
    console.error('Error al cargar pagos:', error)
    alert('No fue posible consultar los pagos desde el servidor.')
  }
})

// Pantalla de pagos conectada con ASP.NET Core y SQL Server.
const busqueda = ref('')
const mostrarModal = ref(false)
const errorFormulario = ref('')

// ==============================================
// MODAL DE ANULACIÓN DE PAGOS
// ==============================================

// Controla la ventana de anulación.
const mostrarModalAnulacion = ref(false)

// Identifica el pago que se desea anular.
const pagoSeleccionadoAnulacion = ref<number | null>(null)

// Motivo obligatorio de la anulación.
const motivoAnulacion = ref('')

// Mensaje de error del formulario de anulación.
const errorAnulacion = ref('')

// Evita confirmar dos veces la misma operación.
const anulandoPago = ref(false)

// Abrir el modal de anulación.
function abrirModalAnulacion(pagoId: number) {
  if (!esAdministradorGeneral.value) return

  pagoSeleccionadoAnulacion.value = pagoId
  motivoAnulacion.value = ''
  errorAnulacion.value = ''
  mostrarModalAnulacion.value = true
}

// Cerrar el modal sin anular.
function cerrarModalAnulacion() {
  if (anulandoPago.value) return

  mostrarModalAnulacion.value = false
  pagoSeleccionadoAnulacion.value = null
  motivoAnulacion.value = ''
  errorAnulacion.value = ''
}

// Controlar el envío del formulario.
const guardandoPago = ref(false)

function formularioVacio(): PagoFormulario {
  return {
    facturaCompraId: 0,
    fechaPago: new Date().toLocaleDateString('en-CA'),
    monto: 0,
    metodoPago: 'Transferencia',
    referencia: '',
    observaciones: ''
  }
}

const formulario = ref<PagoFormulario>(formularioVacio())

// Solo pueden recibir pagos las facturas con saldo pendiente.
const facturasPendientes = computed(() =>
  facturas.value.filter(
    factura =>
      !factura.anulada &&
      factura.saldoPendiente > 0
  )
)

const facturaSeleccionada = computed(() =>
  facturas.value.find(factura => factura.facturaCompraId === Number(formulario.value.facturaCompraId))
)

const saldoSeleccionado = computed(() =>
  facturaSeleccionada.value && !facturaSeleccionada.value.anulada
    ? facturaSeleccionada.value.saldoPendiente
    : 0
)

const pagosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return [...pagos.value]
    .sort((a, b) => b.pagoId - a.pagoId)
    .filter(pago => {
      const factura = facturas.value.find(item => item.facturaCompraId === pago.facturaCompraId)
      const contenido = [
        factura?.numeroFactura ?? '',
        factura?.nombreProveedor ?? '',
        pago.metodoPago,
        pago.referencia,
        String(pago.pagoId)
      ].join(' ').toLowerCase()
      return contenido.includes(texto)
    })
})

// Sumar únicamente los pagos vigentes.
const totalPagado = computed(() =>
  pagos.value
    .filter(pago => !pago.anulado)
    .reduce((suma, pago) => suma + pago.monto, 0)
)

// Contar los pagos vigentes.
const totalAbonos = computed(() =>
  pagos.value.filter(pago => !pago.anulado).length
)
const facturasConSaldo = computed(() => facturasPendientes.value.length)

function nombreFactura(id: number): string {
  return facturas.value.find(factura => factura.facturaCompraId === id)?.numeroFactura ?? `Factura #${id}`
}

function nombreProveedor(id: number): string {
  return facturas.value.find(factura => factura.facturaCompraId === id)?.nombreProveedor ?? 'Proveedor no disponible'
}

function abrirModal() {
  formulario.value = formularioVacio()
  errorFormulario.value = ''
  mostrarModal.value = true
}

// Cerrar el formulario únicamente cuando no se esté guardando.
function cerrarModal() {

  // Impedir cerrar durante el registro del pago.
  if (guardandoPago.value) return

  mostrarModal.value = false
  errorFormulario.value = ''
}

function pagarSaldoCompleto() {
  if (saldoSeleccionado.value > 0) {
    formulario.value.monto = saldoSeleccionado.value
  }
}

// Registrar un pago real en SQL Server.
async function guardarPago(): Promise<void> {

  errorFormulario.value = ''

  if (guardandoPago.value) return

    guardandoPago.value = true

  try {

    // Obtener los datos del formulario.
    const datos = {
      facturaCompraId: Number(formulario.value.facturaCompraId),
      monto: Number(formulario.value.monto),
      metodoPago: formulario.value.metodoPago,
      referencia: formulario.value.referencia.trim(),
      observaciones: formulario.value.observaciones.trim()
    }

    // Validar que se haya seleccionado una factura.
    if (!datos.facturaCompraId) {
      throw new Error('Seleccione una factura válida.')
    }

    // Validar el monto del pago.
    if (!Number.isFinite(datos.monto) || datos.monto <= 0) {
      throw new Error('El monto debe ser mayor que cero.')
    }

    // Evitar registrar pagos superiores al saldo.
    if (datos.monto > saldoSeleccionado.value) {
      throw new Error(
        `El pago no puede superar el saldo pendiente de ${formatoMoneda(saldoSeleccionado.value)}.`
      )
    }

    // Registrar el pago mediante ASP.NET Core.
    await apiPost('/api/Pagos', datos)

    // Actualizar el historial de pagos desde SQL Server.
    await cargarPagos()

    // Actualizar los saldos reales de las facturas.
    await cargarFacturas()

    // Cerrar el formulario después de registrar correctamente.
    mostrarModal.value = false
    errorFormulario.value = ''

  } catch (error) {

    console.error('Error al registrar pago:', error)

    errorFormulario.value =
      error instanceof Error
        ? error.message
        : 'No fue posible registrar el pago.'
  }
  finally {
  guardandoPago.value = false
}
}

// Verificar si el usuario tiene el rol de Administrador General.
const esAdministradorGeneral = computed(() => {
  const usuario = sessionStorage.getItem('sicop_usuario')

  if (!usuario) return false

  try {
    const datosUsuario = JSON.parse(usuario)

    // RolId 1 corresponde al Administrador General.
    return Number(datosUsuario.rolId) === 1

  } catch {
    return false
  }
})

// Anular un pago conservando su historial en SQL Server.
async function anularPago(): Promise<void> {

  if (!esAdministradorGeneral.value || anulandoPago.value) return

  errorAnulacion.value = ''

  const pagoId = pagoSeleccionadoAnulacion.value
  const motivo = motivoAnulacion.value.trim()

  if (pagoId === null) return

  // Validar el motivo obligatorio.
  if (!motivo || motivo.length > 500) {
    errorAnulacion.value = 'Ingrese un motivo válido de máximo 500 caracteres.'
    return
  }

  anulandoPago.value = true

  try {

    // Se conserva el endpoint y el formato del backend.
    await apiPut<void>(
      `/api/Pagos/${pagoId}/anular`,
      motivo
    )

    // Actualizar pagos y saldos reales.
    await cargarPagos()
    await cargarFacturas()

    // Cerrar la ventana al completar la operación.
    mostrarModalAnulacion.value = false
    pagoSeleccionadoAnulacion.value = null
    motivoAnulacion.value = ''
    errorAnulacion.value = ''

  } catch (error) {

    console.error('Error al anular el pago:', error)
    errorAnulacion.value = 'No fue posible anular el pago. Verifica los datos e inténtalo nuevamente.'

  } finally {
    anulandoPago.value = false
  }
}
</script>

<template>
  <main class="pagos-page">
    <header class="page-header">
      <div>
        <span class="page-label">CUENTAS POR PAGAR</span>
        <h1>Pagos</h1>
        <p>Registra abonos y pagos completos de las facturas de compra.</p>
      </div>
      <button type="button" class="btn-primary" :disabled="facturasPendientes.length === 0" @click="abrirModal">
        <span>＋</span> Registrar pago
      </button>
    </header>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">Pagos registrados</span>
        <strong>{{ totalAbonos }}</strong>
        <p>Movimientos de pago realizados</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">Monto pagado</span>
        <strong>{{ formatoMoneda(totalPagado) }}</strong>
        <p>Acumulado de pagos registrados</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">Facturas con saldo</span>
        <strong>{{ facturasConSaldo }}</strong>
        <p>Facturas que aún pueden recibir pagos</p>
      </article>
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>Historial de pagos</h2>
          <p>Consulta los abonos y pagos completos registrados.</p>
        </div>
        <span class="total-badge">{{ pagos.length }} pagos</span>
      </div>

      <div class="search-container">
        <span class="search-icon">⌕</span>
        <input v-model="busqueda" type="search" placeholder="Buscar por factura, proveedor, método o referencia..." aria-label="Buscar pagos" />
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Factura</th>
              <th>Proveedor</th>
              <th>Fecha de pago</th>
              <th>Método</th>
              <th>Referencia</th>
              <th>Monto</th>
              <th>Observaciones</th>
              <th>Estado</th>
              <th v-if="esAdministradorGeneral">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pago in pagosFiltrados" :key="pago.pagoId">
              <td>#{{ pago.pagoId }}</td>
              <td class="invoice-number">{{ nombreFactura(pago.facturaCompraId) }}</td>
              <td class="provider-name">{{ nombreProveedor(pago.facturaCompraId) }}</td>
              <td>{{ formatoFecha(pago.fechaPago) }}</td>
              <td><span class="method-badge">{{ pago.metodoPago }}</span></td>
              <td>{{ pago.referencia || '—' }}</td>
              <td class="money-cell">{{ formatoMoneda(pago.monto) }}</td>
              <td>{{ pago.observaciones || '—' }}</td>
              <td>
                <span :style="{ color: pago.anulado ? '#b42318' : '#247a43', fontWeight: 'bold' }">
                  {{ pago.anulado ? 'Anulado' : 'Vigente' }}
                </span>
              </td>

              <td v-if="esAdministradorGeneral">
                <button
                  v-if="!pago.anulado"
                  type="button"
                  class="btn-secondary"
                  @click="abrirModalAnulacion(pago.pagoId)"
                >
                  Anular
                </button>

                <span v-else>—</span>
              </td>
            </tr>
            <tr v-if="pagosFiltrados.length === 0">
              <td :colspan="esAdministradorGeneral ? 10 : 9" class="empty-state">
                <div class="empty-icon">▤</div>
                <h3>No se encontraron pagos</h3>
                <p>Prueba con otra búsqueda o registra un nuevo pago.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Formulario de registro. Se integra en esta vista para no alterar otros componentes. -->
    <div v-if="mostrarModal" class="modal-overlay" @click.self="cerrarModal">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-pago">
        <header class="modal-header">
          <div>
            <span class="page-label">SICOP · CUENTAS POR PAGAR</span>
            <h2 id="titulo-modal-pago">Registrar pago</h2>
            <p>Selecciona una factura y registra el abono correspondiente.</p>
          </div>
          <button type="button" class="close-button" aria-label="Cerrar formulario" @click="cerrarModal">×</button>
        </header>

        <form id="formulario-pago" class="modal-body" @submit.prevent="guardarPago">
          <div class="field">
            <label for="pago-factura">Factura pendiente *</label>
            <select id="pago-factura" v-model.number="formulario.facturaCompraId" required>
              <option :value="0" disabled>Selecciona una factura</option>
              <option v-for="factura in facturasPendientes" :key="factura.facturaCompraId" :value="factura.facturaCompraId">
                {{ factura.numeroFactura }} — {{ factura.nombreProveedor }}
              </option>
            </select>
          </div>

          <div v-if="facturaSeleccionada" class="saldo-box">
            <span>Saldo disponible para pagar</span>
            <strong>{{ formatoMoneda(saldoSeleccionado) }}</strong>
          </div>

          <div class="field-grid">
            <div class="field">
              <label for="pago-fecha">Fecha de pago *</label>
              <input id="pago-fecha" v-model="formulario.fechaPago" type="date" required />
            </div>
            <div class="field">
              <label for="pago-metodo">Método de pago *</label>
              <select id="pago-metodo" v-model="formulario.metodoPago" required>
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Cheque">Cheque</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div class="field">
            <div class="field-heading">
              <label for="pago-monto">Monto del pago (Q) *</label>
              <button type="button" class="text-button" :disabled="!facturaSeleccionada" @click="pagarSaldoCompleto">Pagar saldo completo</button>
            </div>
            <input id="pago-monto" v-model.number="formulario.monto" type="number" min="0.01" step="0.01" :max="saldoSeleccionado || undefined" required />
          </div>

          <div class="field">
            <label for="pago-referencia">Número de referencia</label>
            <input id="pago-referencia" v-model="formulario.referencia" type="text" maxlength="100" placeholder="Ej. TRF-003" />
          </div>

          <div class="field">
            <label for="pago-observaciones">Observaciones</label>
            <textarea id="pago-observaciones" v-model="formulario.observaciones" rows="3" placeholder="Detalle opcional del pago"></textarea>
          </div>

          <p v-if="errorFormulario" class="error-message" role="alert">{{ errorFormulario }}</p>
        </form>

        <footer class="modal-footer">
          <button type="button" class="btn-secondary" @click="cerrarModal">Cancelar</button>
          <button
              type="submit"
              form="formulario-pago"
              class="btn-primary"
              :disabled="guardandoPago">
              {{ guardandoPago ? 'Guardando...' : 'Guardar pago' }}
          </button>
        </footer>
      </section>
    </div>
    <!-- ============================================== -->
<!-- MODAL PERSONALIZADO PARA ANULAR PAGOS           -->
<!-- ============================================== -->

<div
  v-if="mostrarModalAnulacion"
  class="modal-overlay"
  @click.self="cerrarModalAnulacion"
>
  <section
    class="modal-anulacion-card"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-anulacion-pago"
  >
    <div class="modal-anulacion-icon">!</div>

    <h2 id="titulo-anulacion-pago">Anular pago</h2>

    <p class="modal-anulacion-description">
      ¿Deseas anular el pago
      <strong>#{{ pagoSeleccionadoAnulacion }}</strong>?
    </p>

    <p class="modal-anulacion-note">
      El pago permanecerá en el historial y el saldo
      pendiente de la factura se actualizará.
    </p>

    <form id="form-anulacion-pago" @submit.prevent="anularPago">
      <div class="field">
        <label for="motivo-anulacion-pago">
          Motivo de anulación *
        </label>

        <textarea
          id="motivo-anulacion-pago"
          v-model="motivoAnulacion"
          rows="3"
          maxlength="500"
          required
          placeholder="Escribe el motivo de la anulación..."
        ></textarea>
      </div>

      <p v-if="errorAnulacion" class="error-message" role="alert">
        {{ errorAnulacion }}
      </p>
    </form>

    <div class="modal-anulacion-actions">
      <button
        type="button"
        class="btn-secondary"
        :disabled="anulandoPago"
        @click="cerrarModalAnulacion"
      >
        Cancelar
      </button>

      <button
        type="submit"
        form="form-anulacion-pago"
        class="btn-primary"
        :disabled="anulandoPago"
      >
        {{ anulandoPago ? 'Anulando...' : 'Confirmar anulación' }}
      </button>
    </div>
  </section>
</div>
  </main>
</template>

<style scoped>
.pagos-page { min-height: 100%; padding: 42px; background: #f8f5fc; font-family: Arial, sans-serif; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 24px; margin-bottom: 32px; }
.page-label { color: #9069b6; font-size: 12px; font-weight: 700; letter-spacing: 2px; }
.page-header h1 { margin: 12px 0; color: #352057; font-size: 34px; }
.page-header p { color: #917ca9; font-size: 15px; }
.btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 9px; border: 0; border-radius: 12px; background: #7950ae; color: #fff; padding: 15px 24px; font-size: 14px; font-weight: 600; white-space: nowrap; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #633e96; }
.btn-primary:disabled, .text-button:disabled { opacity: .55; cursor: not-allowed; }
.summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-bottom: 30px; }
.summary-card { min-width: 0; padding: 25px; background: #fff; border: 1px solid #ebe3f5; border-radius: 18px; box-shadow: 0 8px 30px rgba(71, 43, 109, .03); }
.summary-label { color: #927ca9; font-size: 13px; font-weight: 600; }
.summary-card strong { display: block; margin: 18px 0 10px; color: #352057; font-size: clamp(19px, 2vw, 26px); overflow-wrap: anywhere; }
.summary-card p { margin: 0; color: #a18fb4; font-size: 12px; }
.table-card { background: #fff; border: 1px solid #ebe3f5; border-radius: 20px; padding: 30px; box-shadow: 0 8px 30px rgba(71, 43, 109, .03); }
.table-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 25px; }
.table-header h2 { margin: 0 0 10px; color: #352057; font-size: 21px; }
.table-header p { margin: 0; color: #9a87ae; font-size: 14px; }
.total-badge { padding: 10px 16px; border-radius: 30px; background: #f0e8f8; color: #7950ae; font-size: 13px; font-weight: 600; white-space: nowrap; }
.search-container { display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 18px; margin-bottom: 25px; border: 1px solid #e7ddf2; border-radius: 12px; background: #fcfaff; }
.search-icon { color: #7950ae; font-size: 25px; }
.search-container input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: #352057; font-size: 14px; }
.table-responsive { width: 100%; overflow-x: auto; }
table { width: 100%; min-width: 1050px; border-collapse: collapse; text-align: left; }
thead { background: #f7f2fc; }
th { padding: 18px; color: #72558f; font-size: 12px; font-weight: 700; white-space: nowrap; }
td { padding: 19px 18px; border-bottom: 1px solid #f0eaf6; color: #716080; font-size: 13px; }
.invoice-number { color: #7950ae; font-weight: 700; white-space: nowrap; }
.provider-name { color: #352057; font-weight: 700; white-space: nowrap; }
.money-cell { white-space: nowrap; font-weight: 700; }
.method-badge { display: inline-block; padding: 8px 12px; border-radius: 20px; background: #eee9fb; color: #7550a9; font-size: 12px; font-weight: 600; }
.empty-state { padding: 70px 20px; text-align: center; }
.empty-icon { color: #b99bdb; font-size: 45px; }
.empty-state h3 { color: #493078; font-size: 18px; }
.empty-state p { color: #a18fb4; font-size: 14px; }
.modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 20px; background: rgba(34, 20, 53, .55); }
.modal-card { width: min(100%, 680px); max-height: min(90vh, 800px); display: flex; flex-direction: column; overflow: hidden; border-radius: 20px; background: #fff; box-shadow: 0 24px 80px rgba(34, 20, 53, .2); }
.modal-header { display: flex; justify-content: space-between; gap: 20px; padding: 26px 30px 20px; border-bottom: 1px solid #eee5f7; }
.modal-header h2 { margin: 9px 0; color: #352057; font-size: 24px; }
.modal-header p { margin: 0; color: #917ca9; font-size: 13px; }
.close-button { align-self: flex-start; border: 0; background: transparent; color: #866ca3; font-size: 30px; line-height: 1; cursor: pointer; }
.modal-body { overflow-y: auto; padding: 25px 30px; display: flex; flex-direction: column; gap: 19px; }
.field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.field label { color: #5e4678; font-size: 13px; font-weight: 700; }
.field input, .field select, .field textarea { box-sizing: border-box; width: 100%; min-width: 0; border: 1px solid #e3d8f0; border-radius: 10px; background: #fcfaff; color: #352057; padding: 13px 14px; font: inherit; font-size: 14px; }
.field input:focus, .field select:focus, .field textarea:focus { outline: 2px solid #c7abe7; outline-offset: 1px; }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.field-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.text-button { border: 0; padding: 0; background: transparent; color: #7950ae; font-size: 12px; font-weight: 700; cursor: pointer; }
.saldo-box { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-radius: 12px; padding: 15px 18px; background: #f3ecfa; color: #72558f; font-size: 13px; }
.saldo-box strong { color: #493078; font-size: 19px; }
.error-message { margin: 0; padding: 12px 15px; border-radius: 10px; background: #fff0f0; color: #a43131; font-size: 13px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 30px; border-top: 1px solid #eee5f7; background: #fff; }
.btn-secondary { border: 1px solid #e5d9f0; border-radius: 12px; background: #f3ecfa; color: #7950ae; padding: 14px 22px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-secondary:hover { background: #e8d9f5; }
@media (max-width: 1100px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 768px) { .pagos-page { padding: 20px; } .page-header, .table-header { flex-direction: column; align-items: flex-start; } .page-header h1 { font-size: 26px; } .page-header .btn-primary { width: 100%; } .table-card { padding: 18px; } .modal-header, .modal-body, .modal-footer { padding-left: 20px; padding-right: 20px; } }
@media (max-width: 480px) { .summary-grid, .field-grid { grid-template-columns: 1fr; } .modal-footer { flex-direction: column-reverse; } .modal-footer button { width: 100%; } .saldo-box { align-items: flex-start; flex-direction: column; } }
/* ==============================================
   MODAL DE ANULACIÓN DE PAGOS
   ============================================== */

.modal-anulacion-card {
  width: min(100%, 440px);
  max-height: 90vh;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 32px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 24px 80px rgba(34, 20, 53, 0.2);
}

.modal-anulacion-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 55px;
  height: 55px;
  margin-bottom: 18px;
  border-radius: 16px;
  background: #f3ecfa;
  color: #7950ae;
  font-size: 26px;
  font-weight: 700;
}

.modal-anulacion-card h2 {
  margin: 0 0 12px;
  color: #352057;
  font-size: 24px;
}

.modal-anulacion-description {
  color: #5e4678;
  font-size: 14px;
  line-height: 1.6;
}

.modal-anulacion-note {
  margin-bottom: 22px;
  color: #917ca9;
  font-size: 13px;
  line-height: 1.6;
}

.modal-anulacion-card .field textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
}

.modal-anulacion-card .error-message {
  margin-top: 12px;
}

.modal-anulacion-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.modal-anulacion-actions .btn-secondary,
.modal-anulacion-actions .btn-primary {
  padding: 12px 18px;
  font-size: 13px;
}

@media (max-width: 480px) {
  .modal-anulacion-card {
    padding: 24px;
  }

  .modal-anulacion-actions {
    flex-direction: column-reverse;
  }

  .modal-anulacion-actions button {
    width: 100%;
  }
}
</style>
