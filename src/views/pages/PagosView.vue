<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  facturas,
  pagos,
  registrarPago,
  formatoMoneda,
  formatoFecha,
  obtenerSaldoPendiente,
  type PagoFormulario
} from '../../stores/sicopStore'

// Pantalla de pagos de demostración. No requiere backend todavía.
const busqueda = ref('')
const mostrarModal = ref(false)
const errorFormulario = ref('')

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
  facturas.value.filter(factura => obtenerSaldoPendiente(factura.facturaCompraId) > 0)
)

const facturaSeleccionada = computed(() =>
  facturas.value.find(factura => factura.facturaCompraId === Number(formulario.value.facturaCompraId))
)

const saldoSeleccionado = computed(() =>
  facturaSeleccionada.value
    ? obtenerSaldoPendiente(facturaSeleccionada.value.facturaCompraId)
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

const totalPagado = computed(() => pagos.value.reduce((suma, pago) => suma + pago.monto, 0))
const totalAbonos = computed(() => pagos.value.length)
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

function cerrarModal() {
  mostrarModal.value = false
  errorFormulario.value = ''
}

function pagarSaldoCompleto() {
  if (saldoSeleccionado.value > 0) {
    formulario.value.monto = saldoSeleccionado.value
  }
}

function guardarPago() {
  errorFormulario.value = ''
  try {
    // El store valida el monto y descuenta el pago del saldo de la factura.
    registrarPago({
      ...formulario.value,
      facturaCompraId: Number(formulario.value.facturaCompraId),
      monto: Number(formulario.value.monto)
    })
    cerrarModal()
  } catch (error: unknown) {
    errorFormulario.value = error instanceof Error ? error.message : 'No se pudo registrar el pago.'
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
            </tr>
            <tr v-if="pagosFiltrados.length === 0">
              <td colspan="8" class="empty-state">
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
          <button type="submit" form="formulario-pago" class="btn-primary">Guardar pago</button>
        </footer>
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
</style>
