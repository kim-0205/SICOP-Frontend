<script setup lang="ts">
import { ref, computed } from 'vue'
import FacturaModal from '../../components/FacturaModal.vue'

// Datos compartidos con el futuro módulo Pagos.
// Este almacenamiento es temporal; aún no utiliza el backend.
import {
  facturas,
  proveedores,
  guardarFactura as guardarFacturaEnStore,
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

// Abrir el formulario para crear o editar una factura.
const mostrarModal = ref(false)
const facturaSeleccionada = ref<FacturaFormulario | null>(null)

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

// Las validaciones y los cálculos de saldos viven en sicopStore.ts.
// Si hay un error, mantenemos abierto el formulario para corregirlo.
function guardarFactura(datos: FacturaFormulario) {
  try {
    guardarFacturaEnStore(datos)
    cerrarModal()
  } catch (error: unknown) {
    alert(error instanceof Error ? error.message : 'No se pudo guardar la factura.')
  }
}

// Estado de la factura según su saldo pendiente.
function obtenerEstado(factura: FacturaCompra): string {
  if (factura.saldoPendiente <= 0) return 'Pagada'
  if (factura.saldoPendiente < factura.total) return 'Parcialmente pagada'
  return 'Pendiente'
}

function claseEstado(factura: FacturaCompra): string {
  if (factura.saldoPendiente <= 0) return 'paid'
  if (factura.saldoPendiente < factura.total) return 'partial'
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
              <th>ID</th>
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
            <tr v-for="factura in facturasFiltradas" :key="factura.facturaCompraId">
              <td>#{{ factura.facturaCompraId }}</td>
              <td class="invoice-number">{{ factura.numeroFactura }}</td>
              <td class="provider-name">{{ factura.nombreProveedor }}</td>
              <td>{{ formatoFecha(factura.fechaEmision) }}</td>
              <td>{{ formatoFecha(factura.fechaVencimiento) }}</td>
              <td class="money-cell">{{ formatoMoneda(factura.total) }}</td>
              <td class="money-cell">{{ formatoMoneda(factura.saldoPendiente) }}</td>
              <td><span class="status-badge" :class="claseEstado(factura)">{{ obtenerEstado(factura) }}</span></td>
              <td>
                <button type="button" class="btn-edit" @click="editarFactura(factura)">✎ Editar</button>
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
      :proveedores="proveedores"
      @cerrar="cerrarModal"
      @guardar="guardarFactura"
    />
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
</style>
