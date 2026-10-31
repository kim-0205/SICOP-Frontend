
<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { apiGet } from '../../services/api'

// =============================================
// SICOP - ESTADOS DE CUENTA POR PROVEEDOR
// =============================================

// Datos del proveedor.
interface Proveedor {
  proveedorId: number
  nombre: string
  nit: string
}

// Movimientos financieros.
interface MovimientoEstadoCuenta {
  fecha: string
  facturaCompraId: number
  pagoId: number | null
  numeroFactura: string
  tipoMovimiento: string
  descripcion: string
  cargo: number
  abono: number
  saldoAcumulado: number
  anulado: boolean
  motivoAnulacion: string | null
}

// Respuesta del backend .NET.
interface EstadoCuentaRespuesta {
  proveedorId: number
  nombreProveedor: string
  nit: string
  fechaConsulta: string
  totalFacturas: number
  totalFacturado: number
  totalPagado: number
  saldoPendiente: number
  movimientos: MovimientoEstadoCuenta[]
}

// =============================================
// VARIABLES REACTIVAS
// =============================================

const proveedores = ref<Proveedor[]>([])
const proveedorId = ref<number | null>(null)

const estadoCuenta = ref<EstadoCuentaRespuesta | null>(null)

  // =============================================
// PAGINACIÓN DE ESTADOS DE CUENTA
// =============================================

// Cantidad de movimientos por página.
const registrosPorPagina = 5

// Página actual.
const paginaActual = ref(1)

// Total de movimientos del proveedor seleccionado.
const totalMovimientos = computed(() =>
  estadoCuenta.value?.movimientos.length ?? 0
)

// Calcular el total de páginas.
const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(totalMovimientos.value / registrosPorPagina))
)

// Obtener los movimientos de la página actual.
const movimientosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * registrosPorPagina

  return estadoCuenta.value?.movimientos.slice(
    inicio,
    inicio + registrosPorPagina
  ) ?? []
})

// Cambiar de página.
function cambiarPagina(pagina: number) {
  if (pagina >= 1 && pagina <= totalPaginas.value) {
    paginaActual.value = pagina
  }
}

// Regresar a la primera página al cambiar de proveedor.
watch(proveedorId, () => {
  paginaActual.value = 1
})

// Evitar permanecer en una página inexistente.
watch(totalPaginas, (total) => {
  if (paginaActual.value > total) {
    paginaActual.value = total
  }
})

const cargandoProveedores = ref(false)
const cargandoEstadoCuenta = ref(false)

const error = ref('')

// =============================================
// CONSULTAR PROVEEDORES
// =============================================

async function cargarProveedores() {
  cargandoProveedores.value = true
  error.value = ''

  try {
    proveedores.value = await apiGet<Proveedor[]>(
      '/api/Proveedores'
    )
  } catch (err) {
    console.error('Error al consultar proveedores:', err)
    error.value = 'No se pudieron cargar los proveedores.'
  } finally {
    cargandoProveedores.value = false
  }
}

// =============================================
// CONSULTAR ESTADO DE CUENTA
// =============================================

async function consultarEstadoCuenta() {
  if (proveedorId.value === null) {
    estadoCuenta.value = null
    return
  }

  cargandoEstadoCuenta.value = true
  error.value = ''
  estadoCuenta.value = null

  try {
    estadoCuenta.value = await apiGet<EstadoCuentaRespuesta>(
      `/api/EstadosCuenta/proveedor/${proveedorId.value}`
    )
  } catch (err) {
    console.error('Error al consultar estado de cuenta:', err)
    error.value = 'No se pudo consultar el estado de cuenta.'
  } finally {
    cargandoEstadoCuenta.value = false
  }
}

// =============================================
// FORMATO DE MONEDA Y FECHAS
// =============================================

// Convierte cantidades a quetzales.
function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(valor)
}

// Convierte fechas a DD/MM/AAAA.
function formatoFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.substring(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

// Evita insertar HTML no confiable en el PDF.
function escaparHTML(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// =============================================
// IMPRIMIR / GUARDAR PDF
// =============================================

function imprimirEstadoCuenta() {
  const datos = estadoCuenta.value

  if (!datos) {
    return
  }

  // Construye un nombre de archivo seguro.
  const nombreProveedor = datos.nombreProveedor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  const fechaArchivo = datos.fechaConsulta.substring(0, 10)

  const nombreArchivo =
    `SICOP_Estado_de_Cuenta_${nombreProveedor}_${fechaArchivo}`

  // Abre una ventana exclusiva para el documento.
  const ventana = window.open('', '_blank')

  if (!ventana) {
    alert('Permite las ventanas emergentes para imprimir el estado de cuenta.')
    return
  }

  // Construye las filas de la tabla con datos reales.
  const filas = datos.movimientos.map((movimiento) => {
    const tipo = movimiento.anulado
      ? `${movimiento.tipoMovimiento} (Anulado)`
      : movimiento.tipoMovimiento

    const descripcion = movimiento.anulado && movimiento.motivoAnulacion
      ? `${movimiento.descripcion} - Motivo: ${movimiento.motivoAnulacion}`
      : movimiento.descripcion

    return `
      <tr>
        <td>${escaparHTML(formatoFecha(movimiento.fecha))}</td>
        <td>${escaparHTML(movimiento.numeroFactura)}</td>
        <td>${escaparHTML(tipo)}</td>
        <td>${escaparHTML(descripcion)}</td>
        <td class="numero">
          ${movimiento.cargo > 0
            ? escaparHTML(formatoMoneda(movimiento.cargo))
            : '—'}
        </td>
        <td class="numero">
          ${movimiento.abono > 0
            ? escaparHTML(formatoMoneda(movimiento.abono))
            : '—'}
        </td>
        <td class="numero saldo">
          ${escaparHTML(formatoMoneda(movimiento.saldoAcumulado))}
        </td>
      </tr>
    `
  }).join('')

  // Documento independiente, sin Sidebar ni Header.
  const documento = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${escaparHTML(nombreArchivo)}</title>

  <style>
    
@page {
  size: A4 landscape;
  margin: 14mm;
}

* {
  box-sizing: border-box;
}

html {
  background: #eef0f5;
}

body {
  margin: 0;
  padding: 35px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #33234d;
  background: #eef0f5;
}

/* Hoja del reporte */
.reporte {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 38px 42px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 35px rgba(40, 30, 70, 0.10);
}

/* Encabezado */
.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  padding-bottom: 20px;
  margin-bottom: 28px;
  border-bottom: 3px solid #493078;
}

.marca {
  color: #493078;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 1px;
}

.subtitulo {
  margin-top: 4px;
  color: #89799d;
  font-size: 13px;
}

.titulo {
  text-align: right;
}

.titulo h1 {
  margin: 0 0 6px;
  color: #493078;
  font-size: 25px;
}

.titulo p {
  margin: 0;
  color: #89799d;
  font-size: 12px;
}

/* Proveedor */
.proveedor {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 28px;
}

.etiqueta {
  color: #89799d;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.proveedor h2 {
  margin: 8px 0;
  color: #493078;
  font-size: 22px;
}

.proveedor p {
  margin: 4px 0;
  color: #59496d;
}

.fecha {
  text-align: right;
}

.fecha strong {
  display: block;
  margin-top: 8px;
  font-size: 15px;
}

/* Resumen financiero */
.resumen {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.tarjeta {
  min-width: 0;
  padding: 20px 16px;
  border: 1px solid #e5dcef;
  border-radius: 12px;
  background: #ffffff;
  break-inside: avoid;
}

.tarjeta span {
  display: block;
  margin-bottom: 10px;
  color: #89799d;
  font-size: 12px;
}

.tarjeta strong {
  display: block;
  color: #493078;
  font-size: 21px;
  white-space: nowrap;
}

.destacada {
  border: 2px solid #7551a7;
  background: #faf7fe;
}

/* Historial */
.seccion {
  margin-bottom: 15px;
  color: #493078;
  font-size: 18px;
  font-weight: 700;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
}

thead {
  display: table-header-group;
}

th {
  padding: 13px 9px;
  background: #eee5f7;
  color: #493078;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
}

td {
  padding: 13px 9px;
  border-bottom: 1px solid #eee5f7;
  color: #59496d;
  vertical-align: top;
  overflow-wrap: anywhere;
}

th:nth-child(1) { width: 11%; }
th:nth-child(2) { width: 15%; }
th:nth-child(3) { width: 11%; }
th:nth-child(4) { width: 27%; }
th:nth-child(5) { width: 12%; }
th:nth-child(6) { width: 11%; }
th:nth-child(7) { width: 13%; }

.numero {
  text-align: right;
  white-space: nowrap;
}

.saldo {
  color: #493078;
  font-weight: 700;
}

tr {
  break-inside: avoid;
}

/* Saldo final */
.saldo-final {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 25px;
  margin-top: 24px;
  padding: 18px 0;
  border-top: 2px solid #493078;
  break-inside: avoid;
}

.saldo-final span {
  font-size: 15px;
}

.saldo-final strong {
  color: #493078;
  font-size: 25px;
}

/* Pie */
.pie {
  margin-top: 25px;
  padding-top: 14px;
  border-top: 1px solid #eee5f7;
  color: #89799d;
  text-align: center;
  font-size: 10px;
}

/* Botones de la ventana */
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  max-width: 1120px;
  margin: 0 auto 20px;
}

.acciones button {
  padding: 12px 22px;
  border: none;
  border-radius: 9px;
  background: #7551a7;
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.acciones button.secundario {
  background: #e9dff3;
  color: #493078;
}

/* Configuración exclusiva para PDF */
@media print {
  @page {
    size: A4 landscape;
    margin: 12mm;
  }

  html,
  body {
    width: auto;
    margin: 0;
    padding: 0;
    background: white;
  }

  .reporte {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .acciones {
    display: none !important;
  }

  .encabezado {
    margin-bottom: 18px;
    padding-bottom: 12px;
  }

  .proveedor {
    margin-bottom: 18px;
  }

  .resumen {
    gap: 10px;
    margin-bottom: 20px;
  }

  .tarjeta {
    padding: 12px;
  }

  .tarjeta strong {
    font-size: 17px;
  }

  .seccion {
    margin-bottom: 10px;
    font-size: 15px;
  }

  table {
    font-size: 10px;
  }

  th,
  td {
    padding: 8px 6px;
  }

  .saldo-final {
    margin-top: 14px;
    padding: 12px 0;
  }

  .saldo-final strong {
    font-size: 20px;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

  </style>
</head>

<body>

  <div class="acciones">
    <button onclick="window.print()">
      Imprimir / Guardar PDF
    </button>

    <button class="secundario" onclick="window.close()">
      Cerrar
    </button>
  </div>
<div class="reporte">
  <header class="encabezado">
    <div>
      <div class="marca">◆ SICOP</div>
      <div class="subtitulo">
        Sistema de Cuentas por Pagar
      </div>
    </div>

    <div class="titulo">
      <h1>Estado de Cuenta</h1>
      <p>Reporte financiero por proveedor</p>
    </div>
  </header>

  <section class="proveedor">
    <div>
      <div class="etiqueta">Proveedor</div>
      <h2>${escaparHTML(datos.nombreProveedor)}</h2>
      <p>NIT: ${escaparHTML(datos.nit)}</p>
    </div>

    <div class="fecha">
      <div class="etiqueta">Fecha de consulta</div>
      <strong>
        ${escaparHTML(formatoFecha(datos.fechaConsulta))}
      </strong>
    </div>
  </section>

  <section class="resumen">
    <div class="tarjeta">
      <span>Facturas vigentes</span>
      <strong>${datos.totalFacturas}</strong>
    </div>

    <div class="tarjeta">
      <span>Total facturado</span>
      <strong>${escaparHTML(formatoMoneda(datos.totalFacturado))}</strong>
    </div>

    <div class="tarjeta">
      <span>Total pagado</span>
      <strong>${escaparHTML(formatoMoneda(datos.totalPagado))}</strong>
    </div>

    <div class="tarjeta destacada">
      <span>Saldo pendiente</span>
      <strong>${escaparHTML(formatoMoneda(datos.saldoPendiente))}</strong>
    </div>
  </section>

  <div class="seccion">
    Historial de movimientos (${datos.movimientos.length})
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Factura</th>
        <th>Movimiento</th>
        <th>Descripción</th>
        <th class="numero">Cargo</th>
        <th class="numero">Abono</th>
        <th class="numero">Saldo acumulado</th>
      </tr>
    </thead>

    <tbody>
      ${filas || `
        <tr>
          <td colspan="7" style="text-align:center;padding:20px;">
            No hay movimientos registrados.
          </td>
        </tr>
      `}
    </tbody>
  </table>

  <div class="saldo-final">
    <span>Saldo pendiente actual</span>
    <strong>
      ${escaparHTML(formatoMoneda(datos.saldoPendiente))}
    </strong>
  </div>

  <footer class="pie">
    SICOP - Sistema de Cuentas por Pagar
    | Estado de cuenta generado para consulta financiera.
  </footer>
  </div>

</body>
</html>
`

  // Escribe el documento completo.
  ventana.document.open()
  ventana.document.write(documento)
  ventana.document.close()
}

// Carga los proveedores al ingresar.
onMounted(cargarProveedores)
</script>

<template>
  <main class="estados-cuenta">

    <!-- Encabezado -->
    <header class="page-header">
      <div>
        <h1>Estados de Cuenta</h1>
        <p>
          Consulta las facturas, pagos y saldos
          pendientes de cada proveedor.
        </p>
      </div>

      <span class="header-label">
        Control financiero
      </span>
    </header>

    <!-- Selección del proveedor -->
    <section class="content-card selector-card">
      <div>
        <h3>Consultar proveedor</h3>
        <p class="description">
          Selecciona un proveedor para visualizar
          sus movimientos financieros.
        </p>
      </div>

      <div class="selector-row">
        <select
          v-model="proveedorId"
          :disabled="cargandoProveedores"
          @change="consultarEstadoCuenta"
        >
          <option :value="null">
            Selecciona un proveedor
          </option>

          <option
            v-for="proveedor in proveedores"
            :key="proveedor.proveedorId"
            :value="proveedor.proveedorId"
          >
            {{ proveedor.nombre }} - {{ proveedor.nit }}
          </option>
        </select>

        <button
          type="button"
          class="consultar-button"
          :disabled="proveedorId === null || cargandoEstadoCuenta"
          @click="consultarEstadoCuenta"
        >
          {{ cargandoEstadoCuenta ? 'Consultando...' : 'Consultar' }}
        </button>
      </div>
    </section>

    <!-- Mensajes -->
    <div v-if="error" class="error-message" role="alert">
      {{ error }}
    </div>

    <div v-if="cargandoEstadoCuenta" class="loading-state">
      Consultando estado de cuenta...
    </div>

    <!-- Estado de cuenta consultado -->
    <template v-if="estadoCuenta && !cargandoEstadoCuenta">

      <!-- Datos del proveedor -->
      <section class="provider-info">
        <div>
          <span class="section-label">PROVEEDOR SELECCIONADO</span>
          <h2>{{ estadoCuenta.nombreProveedor }}</h2>
          <p>NIT: {{ estadoCuenta.nit }}</p>
        </div>

        <div class="consultation-date">
          <span>Fecha de consulta</span>

          <strong>
            {{ formatoFecha(estadoCuenta.fechaConsulta) }}
          </strong>

          <!-- Genera un documento independiente -->
          <button
            type="button"
            class="print-button"
            @click="imprimirEstadoCuenta"
          >
            🖨 Imprimir / Guardar PDF
          </button>
        </div>
      </section>

      <!-- Resumen financiero -->
      <section class="stats-grid">

        <article class="stat-card">
          <div class="stat-icon">▤</div>
          <p>Facturas vigentes</p>
          <h2>{{ estadoCuenta.totalFacturas }}</h2>
          <span>Facturas del proveedor</span>
        </article>

        <article class="stat-card">
          <div class="stat-icon">◈</div>
          <p>Total facturado</p>
          <h2>
            {{ formatoMoneda(estadoCuenta.totalFacturado) }}
          </h2>
          <span>Compras registradas</span>
        </article>

        <article class="stat-card">
          <div class="stat-icon">✓</div>
          <p>Total pagado</p>
          <h2>
            {{ formatoMoneda(estadoCuenta.totalPagado) }}
          </h2>
          <span>Abonos válidos realizados</span>
        </article>

        <article class="stat-card pending-card">
          <div class="stat-icon">◉</div>
          <p>Saldo pendiente</p>
          <h2>
            {{ formatoMoneda(estadoCuenta.saldoPendiente) }}
          </h2>
          <span>Deuda actual del proveedor</span>
        </article>

      </section>

      <!-- Historial -->
      <section class="content-card movements-card">

        <div class="movements-header">
          <div>
            <h3>Historial de movimientos</h3>
            <p class="description">
              Detalle cronológico de cargos, abonos
              y saldos acumulados.
            </p>
          </div>

          <span class="movements-count">
            {{ estadoCuenta.movimientos.length }}
            movimientos
          </span>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Factura</th>
                <th>Movimiento</th>
                <th>Descripción</th>
                <th class="amount">Cargo</th>
                <th class="amount">Abono</th>
                <th class="amount">Saldo acumulado</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(movimiento, index) in movimientosPaginados"
                :key="`${movimiento.tipoMovimiento}-${movimiento.facturaCompraId}-${movimiento.pagoId ?? ((paginaActual - 1) * registrosPorPagina + index)}`"
              >
                <td>
                  {{ formatoFecha(movimiento.fecha) }}
                </td>

                <td class="invoice-number">
                  {{ movimiento.numeroFactura }}
                </td>

                <td>
                  <span
                    class="movement-badge"
                    :class="{
                      'badge-payment': movimiento.tipoMovimiento === 'Pago',
                      'badge-cancelled': movimiento.anulado
                    }"
                  >
                    {{
                      movimiento.anulado
                        ? 'Anulado'
                        : movimiento.tipoMovimiento
                    }}
                  </span>
                </td>

                <td>
                  <div class="movement-description">
                    {{ movimiento.descripcion }}

                    <small
                      v-if="movimiento.anulado && movimiento.motivoAnulacion"
                    >
                      Motivo: {{ movimiento.motivoAnulacion }}
                    </small>
                  </div>
                </td>

                <td class="amount charge">
                  {{
                    movimiento.cargo > 0
                      ? formatoMoneda(movimiento.cargo)
                      : '—'
                  }}
                </td>

                <td class="amount payment">
                  {{
                    movimiento.abono > 0
                      ? formatoMoneda(movimiento.abono)
                      : '—'
                  }}
                </td>

                <td class="amount balance">
                  {{ formatoMoneda(movimiento.saldoAcumulado) }}
                </td>
              </tr>

              <tr v-if="estadoCuenta.movimientos.length === 0">
                <td colspan="7" class="empty-table">
                  Este proveedor todavía no tiene movimientos registrados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ====================================== -->
<!-- PAGINACIÓN DE ESTADOS DE CUENTA        -->
<!-- ====================================== -->

<div
  v-if="totalMovimientos > 0"
  class="pagination-container"
>
  <span class="pagination-info">
    Mostrando
    {{ (paginaActual - 1) * registrosPorPagina + 1 }}
    -
    {{ Math.min(paginaActual * registrosPorPagina, totalMovimientos) }}
    de {{ totalMovimientos }} movimientos
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

        <!-- Saldo final -->
        <div class="final-balance">
          <span>Saldo pendiente actual</span>
          <strong>
            {{ formatoMoneda(estadoCuenta.saldoPendiente) }}
          </strong>
        </div>

      </section>
    </template>

    <!-- Pantalla inicial -->
    <section
      v-if="!estadoCuenta && !cargandoEstadoCuenta && !error"
      class="welcome-state"
    >
      <div class="welcome-icon">▥</div>
      <h3>Consulta un estado de cuenta</h3>
      <p>
        Selecciona un proveedor para visualizar
        sus facturas, pagos y saldo pendiente.
      </p>
    </section>

  </main>
</template>

<style scoped>
/* =============================================
   CONTENEDOR PRINCIPAL
============================================= */
.estados-cuenta {
  min-height: 100vh;
  padding: 36px;
  background: #f8f5fc;
  font-family: 'Segoe UI', Arial, sans-serif;
}

/* Encabezado */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}

.page-header h1 {
  margin: 0 0 8px;
  color: #33234d;
  font-size: 30px;
}

.page-header p,
.description {
  color: #89799d;
  font-size: 14px;
  line-height: 1.6;
}

.header-label {
  padding: 10px 18px;
  background: #eee5f7;
  color: #7551a7;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

/* Tarjetas generales */
.content-card {
  background: white;
  border: 1px solid #eee5f7;
  border-radius: 16px;
  padding: 26px;
  margin-bottom: 24px;
}

.content-card h3 {
  margin: 0 0 8px;
  color: #33234d;
  font-size: 18px;
}

/* Selector de proveedor */
.selector-row {
  display: flex;
  gap: 14px;
  margin-top: 20px;
}

.selector-row select {
  flex: 1;
  min-width: 0;
  padding: 13px 15px;
  border: 1px solid #e5dcef;
  border-radius: 10px;
  background: #fdfbff;
  color: #493078;
  font-size: 14px;
}

.consultar-button,
.print-button {
  padding: 13px 24px;
  border: none;
  border-radius: 10px;
  background: #7551a7;
  color: white;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.consultar-button:hover,
.print-button:hover {
  background: #60418d;
}

.consultar-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Datos del proveedor */
.provider-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.section-label {
  color: #89799d;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}

.provider-info h2 {
  margin: 8px 0;
  color: #493078;
  font-size: 23px;
}

.provider-info p,
.consultation-date span {
  color: #89799d;
  font-size: 13px;
}

.consultation-date {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  text-align: right;
}

.consultation-date strong {
  color: #493078;
}

.print-button {
  margin-top: 10px;
  white-space: nowrap;
}

/* Tarjetas financieras */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  min-width: 0;
  padding: 24px;
  background: white;
  border: 1px solid #eee5f7;
  border-radius: 16px;
  box-shadow: 0 5px 18px rgba(73, 48, 120, 0.04);
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 20px;
  background: #eee5f7;
  border-radius: 12px;
  color: #7551a7;
  font-size: 23px;
}

.stat-card p {
  margin: 0;
  color: #89799d;
  font-size: 14px;
}

.stat-card h2 {
  margin: 12px 0;
  color: #493078;
  font-size: clamp(20px, 2vw, 28px);
  overflow-wrap: anywhere;
}

.stat-card span {
  color: #a69bb2;
  font-size: 12px;
}

.pending-card {
  border-color: #d8c2ee;
}

/* Historial */
.movements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
}

.movements-count {
  padding: 8px 12px;
  border-radius: 20px;
  background: #eee5f7;
  color: #7551a7;
  font-size: 12px;
  white-space: nowrap;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 850px;
}

thead {
  background: #f8f5fc;
}

th {
  padding: 15px 12px;
  text-align: left;
  color: #7551a7;
  font-size: 12px;
  font-weight: 700;
}

td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0e9f7;
  color: #59496d;
  font-size: 13px;
}

.invoice-number {
  font-weight: 600;
  color: #493078;
}

.amount {
  text-align: right;
  white-space: nowrap;
}

.charge {
  color: #a85c47;
}

.payment {
  color: #27815b;
}

.balance {
  font-weight: 700;
  color: #493078;
}

.movement-badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 20px;
  background: #eee5f7;
  color: #7551a7;
  font-size: 11px;
  font-weight: 600;
}

.badge-payment {
  background: #e9f7ee;
  color: #287849;
}

.badge-cancelled {
  background: #fff0f0;
  color: #b33c3c;
}

.movement-description {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.movement-description small {
  color: #b33c3c;
  font-size: 11px;
}

.empty-table {
  text-align: center;
  padding: 40px;
  color: #89799d;
}

/* Saldo final */
.final-balance {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
  padding: 22px 10px 4px;
  color: #493078;
}

.final-balance strong {
  font-size: 22px;
}

/* Mensajes */
.error-message {
  margin-bottom: 24px;
  padding: 15px;
  border: 1px solid #f2caca;
  border-radius: 10px;
  background: #fff4f4;
  color: #a33232;
}

.loading-state {
  padding: 35px;
  text-align: center;
  color: #7551a7;
}

.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 25px;
  text-align: center;
  background: white;
  border: 1px solid #eee5f7;
  border-radius: 16px;
}

.welcome-icon {
  display: grid;
  place-items: center;
  width: 65px;
  height: 65px;
  border-radius: 18px;
  background: #eee5f7;
  color: #7551a7;
  font-size: 32px;
}

.welcome-state h3 {
  margin-bottom: 8px;
  color: #493078;
}

.welcome-state p {
  max-width: 380px;
  color: #89799d;
  font-size: 14px;
  line-height: 1.7;
}

/* Pantallas medianas */
@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Celulares */
@media (max-width: 650px) {
  .estados-cuenta {
    padding: 20px;
  }

  .page-header,
  .provider-info,
  .movements-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .selector-row {
    flex-direction: column;
  }

  .consultation-date {
    align-items: flex-start;
    text-align: left;
  }

  .final-balance {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
}
/* =========================================
   PAGINACIÓN DE ESTADOS DE CUENTA
   ========================================= */

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
  color: #826d99;
  font-size: 13px;
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
  color: #493078;
  font-size: 13px;
  font-weight: 600;
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
