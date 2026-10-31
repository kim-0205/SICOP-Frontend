<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  type ChartOptions,
} from 'chart.js'
import { apiGet } from '../../services/api'

// SICOP - Dashboard administrativo.
// Estadísticas, gráficas, facturas, pagos y alertas.

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale
)

// GET /api/Dashboard/resumen
interface DashboardResumen {
  totalProveedores: number
  totalFacturas: number
  montoFacturado: number
  totalPagado: number
  saldoPendiente: number
  facturasPagadas: number
  facturasPendientes: number
  facturasVencidas: number
  montoVencido: number
  fechaConsulta: string
}

// GET /api/Dashboard/mensual
interface DashboardMensual {
  anio: number
  mes: number
  nombreMes: string
  totalFacturado: number
  totalPagado: number
  cantidadFacturas: number
  cantidadPagos: number
}

// DTO utilizado por los reportes de facturas.
interface ReporteFactura {
  facturaCompraId: number
  numeroFactura: string
  proveedorId: number
  nombreProveedor: string
  fechaEmision: string
  fechaVencimiento: string
  total: number
  totalPagado: number
  saldoPendiente: number
  estado: string
  diasVencidos: number
}

// DTO utilizado por el historial de pagos.
interface ReportePago {
  pagoId: number
  facturaCompraId: number
  numeroFactura: string
  proveedorId: number
  nombreProveedor: string
  fechaPago: string
  monto: number
  metodoPago: string
  referencia: string
  observaciones: string
  anulado: boolean
  fechaAnulacion: string | null
  motivoAnulacion: string | null
}

// Estadísticas generales.
const resumen = ref<DashboardResumen | null>(null)

// Datos mensuales.
const datosMensuales = ref<DashboardMensual[]>([])

// Facturas y pagos recientes.
const facturasRecientes = ref<ReporteFactura[]>([])
const facturasParaAlertas = ref<ReporteFactura[]>([])
const pagosRecientes = ref<ReportePago[]>([])

// Configuración de días para las alertas.
const diasAlertaVencimiento = ref(5)

// Estado de carga de la configuración.
const cargandoConfiguracionAlertas = ref(false)
// =============================================
// PAGINACIÓN DEL DASHBOARD
// =============================================

// Cantidad de registros por página.
const registrosPorPagina = 5

// Página actual de cada sección.
const paginaFacturas = ref(1)
const paginaPagos = ref(1)

// Total de páginas de facturas.
const totalPaginasFacturas = computed(() =>
  Math.max(1, Math.ceil(facturasRecientes.value.length / registrosPorPagina))
)

// Total de páginas de pagos.
const totalPaginasPagos = computed(() =>
  Math.max(1, Math.ceil(pagosRecientes.value.length / registrosPorPagina))
)

// Facturas visibles en la página actual.
const facturasPaginadas = computed(() => {
  const inicio = (paginaFacturas.value - 1) * registrosPorPagina

  return facturasRecientes.value.slice(
    inicio,
    inicio + registrosPorPagina
  )
})

// Pagos visibles en la página actual.
const pagosPaginados = computed(() => {
  const inicio = (paginaPagos.value - 1) * registrosPorPagina

  return pagosRecientes.value.slice(
    inicio,
    inicio + registrosPorPagina
  )
})

// Cambiar página de facturas.
function cambiarPaginaFacturas(pagina: number) {
  if (pagina >= 1 && pagina <= totalPaginasFacturas.value) {
    paginaFacturas.value = pagina
  }
}

// Cambiar página de pagos.
function cambiarPaginaPagos(pagina: number) {
  if (pagina >= 1 && pagina <= totalPaginasPagos.value) {
    paginaPagos.value = pagina
  }
}

// Estados de carga.
const cargando = ref(true)
const cargandoGraficas = ref(true)
const cargandoFacturas = ref(true)
const cargandoPagos = ref(true)

// Mensajes de error.
const error = ref('')
const errorGraficas = ref('')
const errorFacturas = ref('')
const errorPagos = ref('')

// Año seleccionado.
const anioSeleccionado = ref(new Date().getFullYear())

// Formato de moneda guatemalteca.
function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(valor)
}

// Formato de fecha.
function formatoFecha(fecha: string): string {
  if (!fecha) return '—'

  const parteFecha = fecha.substring(0, 10)
  const partes = parteFecha.split('-')

  if (partes.length !== 3) return fecha

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

// Consultar estadísticas generales.
async function cargarResumen() {
  cargando.value = true
  error.value = ''

  try {
    resumen.value = await apiGet<DashboardResumen>(
      '/api/Dashboard/resumen'
    )
  } catch (err) {
    console.error('Error al cargar Dashboard:', err)
    resumen.value = null
    error.value = 'No se pudieron cargar las estadísticas.'
  } finally {
    cargando.value = false
  }
}

// Consultar estadísticas mensuales.
async function cargarGraficas() {
  cargandoGraficas.value = true
  errorGraficas.value = ''

  try {
    datosMensuales.value = await apiGet<DashboardMensual[]>(
      `/api/Dashboard/mensual?anio=${anioSeleccionado.value}`
    )
  } catch (err) {
    console.error('Error al cargar gráficas:', err)
    datosMensuales.value = []
    errorGraficas.value =
      'No se pudieron cargar las estadísticas mensuales.'
  } finally {
    cargandoGraficas.value = false
  }
}

// Consultar los días de anticipación configurados.
async function cargarConfiguracionAlertas() {
  cargandoConfiguracionAlertas.value = true

  try {
    const respuesta = await apiGet<{ dias: number }>(
      '/api/ParametrosSistemas/dias-alerta-vencimiento'
    )

    diasAlertaVencimiento.value =
      respuesta.dias > 0 ? respuesta.dias : 5

  } catch (err) {
    console.error(
      'Error al cargar configuración de alertas:',
      err
    )

    // Valor de respaldo si no se puede consultar el parámetro.
    diasAlertaVencimiento.value = 5

  } finally {
    cargandoConfiguracionAlertas.value = false
  }
}

// Consultar facturas recientes y conservar
// todas las facturas pendientes para las alertas.
async function cargarFacturasRecientes() {
  cargandoFacturas.value = true
  errorFacturas.value = ''

  try {
    const [pendientes, pagadas] = await Promise.all([
      apiGet<ReporteFactura[]>(
        '/api/Reportes/facturas-pendientes'
      ),
      apiGet<ReporteFactura[]>(
        '/api/Reportes/facturas-pagadas'
      ),
    ])

    // Conserva todas las facturas pendientes
    // que todavía tengan saldo por pagar.
    facturasParaAlertas.value = pendientes.filter(
      factura => Number(factura.saldoPendiente) > 0
    )

    // Combina y ordena las facturas recientes.
    // Conserva únicamente las cinco más recientes.
    facturasRecientes.value = [...pendientes, ...pagadas]
      .sort((a, b) => {
        const diferencia =
          new Date(b.fechaEmision).getTime() -
          new Date(a.fechaEmision).getTime()

              return diferencia !== 0
        ? diferencia
        : b.facturaCompraId - a.facturaCompraId
      })

  } catch (err) {
    console.error(
      'Error al cargar facturas recientes:',
      err
    )

    facturasRecientes.value = []
    facturasParaAlertas.value = []

    errorFacturas.value =
      'No se pudieron consultar las facturas recientes.'

  } finally {
    cargandoFacturas.value = false
  }
}

// Consultar los últimos pagos registrados.
// Se conservan también los pagos anulados en el historial.
async function cargarPagosRecientes() {
  cargandoPagos.value = true
  errorPagos.value = ''

  try {
    const pagos = await apiGet<ReportePago[]>(
      '/api/Reportes/historial-pagos'
    )

    pagosRecientes.value = pagos
      .sort((a, b) => {
        const diferencia =
          new Date(b.fechaPago).getTime() -
          new Date(a.fechaPago).getTime()

                return diferencia !== 0
          ? diferencia
          : b.pagoId - a.pagoId
      })

  } catch (err) {
    console.error(
      'Error al cargar pagos recientes:',
      err
    )

    pagosRecientes.value = []

    errorPagos.value =
      'No se pudo consultar la actividad reciente.'

  } finally {
    cargandoPagos.value = false
  }
}

// Calcular los días restantes hasta el vencimiento.
// Calcular los días restantes hasta el vencimiento.
function calcularDiasRestantes(fechaVencimiento: string): number {
  if (!fechaVencimiento) return Number.NaN

  const partes = fechaVencimiento
    .substring(0, 10)
    .split('-')
    .map(Number)

  if (partes.length !== 3 || partes.some(Number.isNaN)) {
    return Number.NaN
  }

  const anio = partes[0] ?? 0
  const mes = partes[1] ?? 0
  const dia = partes[2] ?? 0

  if (
    anio < 1 ||
    mes < 1 || mes > 12 ||
    dia < 1 || dia > 31
  ) {
    return Number.NaN
  }

  const hoy = new Date()

  const fechaActual = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate()
  )

  const vencimiento = new Date(
    anio,
    mes - 1,
    dia
  )

  return Math.round(
    (vencimiento.getTime() - fechaActual.getTime()) /
    (1000 * 60 * 60 * 24)
  )
}

// Facturas próximas a vencer.
// Solo se incluyen facturas con saldo pendiente.
const facturasProximasVencer = computed(() =>
  facturasParaAlertas.value
    .filter((factura) => {
      const diasRestantes = calcularDiasRestantes(
        factura.fechaVencimiento
      )

      return (
        Number(factura.saldoPendiente) > 0 &&
        diasRestantes >= 0 &&
        diasRestantes <= diasAlertaVencimiento.value
      )
    })
    .sort((a, b) =>
      calcularDiasRestantes(a.fechaVencimiento) -
      calcularDiasRestantes(b.fechaVencimiento)
    )
)

// Facturas vencidas que todavía tienen saldo pendiente.
const facturasVencidasAlerta = computed(() =>
  facturasParaAlertas.value
    .filter((factura) => {
      const diasRestantes = calcularDiasRestantes(
        factura.fechaVencimiento
      )

      return (
        Number(factura.saldoPendiente) > 0 &&
        diasRestantes < 0
      )
    })
    .sort((a, b) =>
      calcularDiasRestantes(a.fechaVencimiento) -
      calcularDiasRestantes(b.fechaVencimiento)
    )
)

// Gráfica de barras: facturación y pagos mensuales.
const graficaMensual = computed(() => ({
  labels: datosMensuales.value.map(
    dato => dato.nombreMes
  ),
  datasets: [
    {
      label: 'Facturado',
      data: datosMensuales.value.map(
        dato => dato.totalFacturado
      ),
      backgroundColor: '#7551a7',
      borderRadius: 6,
      maxBarThickness: 32,
    },
    {
      label: 'Pagado',
      data: datosMensuales.value.map(
        dato => dato.totalPagado
      ),
      backgroundColor: '#c5a7e8',
      borderRadius: 6,
      maxBarThickness: 32,
    },
  ],
}))

// Configuración de la gráfica mensual.
const opcionesMensuales: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const valor = context.parsed.y ?? 0
          return `${context.dataset.label}: ${formatoMoneda(valor)}`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: valor => formatoMoneda(Number(valor)),
      },
    },
  },
}

// Gráfica circular: estado de las facturas.
const graficaEstados = computed(() => ({
  labels: ['Pagadas', 'Pendientes o parciales'],
  datasets: [
    {
      data: [
        resumen.value?.facturasPagadas ?? 0,
        resumen.value?.facturasPendientes ?? 0,
      ],
      backgroundColor: [
        '#7551a7',
        '#d9c5ee',
      ],
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 8,
    },
  ],
}))

const opcionesEstados: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
}

// Comprobar si existen facturas.
const hayFacturas = computed(
  () => (resumen.value?.totalFacturas ?? 0) > 0
)

// Cargar información al abrir el Dashboard.
onMounted(() => {
  cargarResumen()
  cargarGraficas()
  cargarFacturasRecientes()
  cargarPagosRecientes()
  cargarConfiguracionAlertas()
})
</script>

<template>
  <main class="dashboard">

    <!-- Encabezado principal -->
    <header class="dashboard-header">
      <div>
        <h1>Panel principal</h1>
        <p>Bienvenido al Sistema de Cuentas por Pagar.</p>
      </div>

      <span class="dashboard-label">
        Resumen general
      </span>
    </header>

    <!-- Error en estadísticas generales -->
    <div v-if="error" class="error-message" role="alert">
      <span>{{ error }}</span>
      <button type="button" @click="cargarResumen">
        Reintentar
      </button>
    </div>

    <!-- Alertas de vencimiento -->
    <section
      class="alerts-section"
      aria-label="Alertas de vencimiento"
    >

      <div class="alerts-heading">
        <div>
          <h2>Alertas de vencimiento</h2>

          <p>
            Facturas con saldo pendiente que requieren seguimiento.
            Configuración: {{ diasAlertaVencimiento }}
            días de anticipación.
          </p>
        </div>

        <span class="alerts-icon">♧</span>
      </div>

      <div
        v-if="cargandoFacturas || cargandoConfiguracionAlertas"
        class="alerts-empty"
      >
        Cargando alertas de vencimiento…
      </div>

      <div v-else class="alerts-grid">

        <!-- Facturas próximas a vencer -->
        <article class="alert-card alert-upcoming">

          <div class="alert-card-heading">
            <div>
              <span class="alert-kicker">
                PRÓXIMAS A VENCER
              </span>

              <strong>
                {{ facturasProximasVencer.length }}
              </strong>
            </div>

            <span class="alert-status upcoming-status">
              Por vencer
            </span>
          </div>

          <div
            v-if="facturasProximasVencer.length === 0"
            class="alert-no-items"
          >
            No hay facturas próximas a vencer.
          </div>

          <div v-else class="alert-list">

            <div
              v-for="factura in facturasProximasVencer"
              :key="`proxima-${factura.facturaCompraId}`"
              class="alert-item"
            >

              <div class="alert-item-details">
                <strong>{{ factura.numeroFactura }}</strong>

                <span>
                  {{ factura.nombreProveedor }}
                </span>

                <small>
                  Vence:
                  {{ formatoFecha(factura.fechaVencimiento) }}
                </small>
              </div>

              <div class="alert-item-amount">
                <strong>
                  {{ formatoMoneda(Number(factura.saldoPendiente)) }}
                </strong>

                <small>
                  {{
                    calcularDiasRestantes(factura.fechaVencimiento) === 0
                      ? 'Vence hoy'
                      : `En ${calcularDiasRestantes(factura.fechaVencimiento)} días`
                  }}
                </small>
              </div>

            </div>

          </div>
        </article>

        <!-- Facturas vencidas -->
        <article class="alert-card alert-overdue">

          <div class="alert-card-heading">
            <div>
              <span class="alert-kicker">
                FACTURAS VENCIDAS
              </span>

              <strong>
                {{ facturasVencidasAlerta.length }}
              </strong>
            </div>

            <span class="alert-status overdue-status">
              Requieren atención
            </span>
          </div>

          <div
            v-if="facturasVencidasAlerta.length === 0"
            class="alert-no-items"
          >
            No hay facturas vencidas con saldo pendiente.
          </div>

          <div v-else class="alert-list">

            <div
              v-for="factura in facturasVencidasAlerta"
              :key="`vencida-${factura.facturaCompraId}`"
              class="alert-item"
            >

              <div class="alert-item-details">
                <strong>{{ factura.numeroFactura }}</strong>

                <span>
                  {{ factura.nombreProveedor }}
                </span>

                <small>
                  Venció:
                  {{ formatoFecha(factura.fechaVencimiento) }}
                </small>
              </div>

              <div class="alert-item-amount">
                <strong>
                  {{ formatoMoneda(Number(factura.saldoPendiente)) }}
                </strong>

                <small>
                  Hace
                  {{ Math.abs(calcularDiasRestantes(factura.fechaVencimiento)) }}
                  días
                </small>
              </div>

            </div>

          </div>
        </article>

      </div>

      <p v-if="errorFacturas" class="alerts-note">
        No fue posible cargar las facturas para generar las alertas.
      </p>

    </section>

    <!-- Tarjetas originales -->
    <section class="stats-grid">

      <article class="stat-card">
        <div class="stat-icon">♙</div>
        <p>Total de proveedores</p>

        <h2>
          {{ cargando ? '…' : (resumen?.totalProveedores ?? '—') }}
        </h2>

        <span>Proveedores activos</span>
      </article>

      <article class="stat-card">
        <div class="stat-icon">▤</div>
        <p>Facturas registradas</p>

        <h2>
          {{ cargando ? '…' : (resumen?.totalFacturas ?? '—') }}
        </h2>

        <span>Facturas de compra vigentes</span>
      </article>

      <article class="stat-card">
        <div class="stat-icon">◈</div>
        <p>Saldo pendiente</p>

        <h2>
          {{
            cargando
              ? '…'
              : resumen
                ? formatoMoneda(resumen.saldoPendiente)
                : '—'
          }}
        </h2>

        <span>Cuentas pendientes de pago</span>
      </article>

      <article class="stat-card">
        <div class="stat-icon">✓</div>
        <p>Total pagado</p>

        <h2>
          {{
            cargando
              ? '…'
              : resumen
                ? formatoMoneda(resumen.totalPagado)
                : '—'
          }}
        </h2>

        <span>Monto abonado a facturas</span>
      </article>

    </section>

    <!-- Gráficas financieras existentes -->
    <section class="charts-grid">

      <!-- Facturación y pagos mensuales -->
      <article class="content-card chart-card">

        <div class="chart-header">
          <div>
            <h3>Facturación y pagos mensuales</h3>

            <p class="card-description">
              Comparación de los movimientos financieros.
            </p>
          </div>

          <select
            v-model.number="anioSeleccionado"
            class="year-select"
            aria-label="Seleccionar año"
            @change="cargarGraficas"
          >
            <option
              v-for="anio in 5"
              :key="anio"
              :value="new Date().getFullYear() - (anio - 1)"
            >
              {{ new Date().getFullYear() - (anio - 1) }}
            </option>
          </select>
        </div>

        <div v-if="cargandoGraficas" class="chart-message">
          Cargando gráfica mensual…
        </div>

        <div v-else-if="errorGraficas" class="chart-message">
          <p>{{ errorGraficas }}</p>

          <button
            type="button"
            class="retry-button"
            @click="cargarGraficas"
          >
            Reintentar
          </button>
        </div>

        <div v-else class="chart-container">
          <Bar
            :data="graficaMensual"
            :options="opcionesMensuales"
          />
        </div>

      </article>

      <!-- Estado de las facturas -->
      <article class="content-card chart-card">

        <h3>Estado de las facturas</h3>

        <p class="card-description">
          Distribución de las facturas vigentes.
        </p>

        <div v-if="cargando" class="chart-message">
          Cargando estados…
        </div>

        <div v-else-if="!resumen" class="chart-message">
          No se pudo obtener la información.
        </div>

        <div v-else-if="!hayFacturas" class="chart-message">
          No hay facturas registradas.
        </div>

        <div
          v-else
          class="chart-container doughnut-container"
        >
          <Doughnut
            :data="graficaEstados"
            :options="opcionesEstados"
          />

          <div class="chart-summary">
            <strong>{{ resumen.totalFacturas }}</strong>
            <span>Facturas vigentes</span>
          </div>
        </div>

      </article>

    </section>

    <!-- Facturas y actividad reciente -->
    <section class="dashboard-content">

      <!-- Últimas facturas -->
      <article class="content-card">

        <div class="section-header">
          <div>
            <h3>Facturas recientes</h3>

            <p class="card-description">
              Últimas facturas registradas en el sistema.
            </p>
          </div>

          <span class="section-icon">▤</span>
        </div>

        <div v-if="cargandoFacturas" class="empty-state">
          <span>◷</span>
          <p>Cargando facturas…</p>
        </div>

        <div v-else-if="errorFacturas" class="empty-state">
          <span>!</span>
          <p>{{ errorFacturas }}</p>

          <button
            type="button"
            class="retry-button"
            @click="cargarFacturasRecientes"
          >
            Reintentar
          </button>
        </div>

        <div
          v-else-if="facturasRecientes.length === 0"
          class="empty-state"
        >
          <span>▤</span>
          <p>Sin información disponible</p>
          <small>No hay facturas vigentes registradas.</small>
        </div>

        <div v-else class="recent-list">

          <div
            v-for="factura in facturasPaginadas"
            :key="factura.facturaCompraId"
            class="recent-item"
          >
            <div class="recent-item-main">
              <div class="recent-icon">▤</div>

              <div class="recent-details">
                <strong>{{ factura.numeroFactura }}</strong>
                <span>{{ factura.nombreProveedor }}</span>

                <small>
                  {{ formatoFecha(factura.fechaEmision) }}
                </small>
              </div>
            </div>

            <div class="recent-item-right">
              <strong>
                {{ formatoMoneda(factura.total) }}
              </strong>

              <span
                class="status-badge"
                :class="{
                  'status-paid': factura.estado === 'Pagada',
                  'status-overdue': factura.estado === 'Vencida',
                }"
              >
                {{ factura.estado }}
              </span>
            </div>
          </div>

        </div>

        <!-- PAGINACIÓN DE FACTURAS: PEGAR AQUÍ -->
        <div v-if="facturasRecientes.length > 0" class="pagination-container">
          <span class="pagination-info">
            Mostrando
            {{ (paginaFacturas - 1) * registrosPorPagina + 1 }}
            -
            {{ Math.min(paginaFacturas * registrosPorPagina, facturasRecientes.length) }}
            de {{ facturasRecientes.length }} facturas
          </span>

          <div class="pagination-buttons">
            <button
              type="button"
              class="pagination-btn"
              :disabled="paginaFacturas === 1"
              @click="cambiarPaginaFacturas(paginaFacturas - 1)"
            >
              ‹ Anterior
            </button>

            <span class="pagination-current">
              Página {{ paginaFacturas }} de {{ totalPaginasFacturas }}
            </span>

            <button
              type="button"
              class="pagination-btn"
              :disabled="paginaFacturas === totalPaginasFacturas"
              @click="cambiarPaginaFacturas(paginaFacturas + 1)"
            >
              Siguiente ›
            </button>
          </div>
        </div>

      </article>

      <!-- Últimos pagos -->
      <article class="content-card">

        <div class="section-header">
          <div>
            <h3>Actividad reciente</h3>

            <p class="card-description">
              Últimos pagos registrados en SICOP.
            </p>
          </div>

          <span class="section-icon">◷</span>
        </div>

        <div v-if="cargandoPagos" class="empty-state">
          <span>◷</span>
          <p>Cargando movimientos…</p>
        </div>

        <div v-else-if="errorPagos" class="empty-state">
          <span>!</span>
          <p>{{ errorPagos }}</p>

          <button
            type="button"
            class="retry-button"
            @click="cargarPagosRecientes"
          >
            Reintentar
          </button>
        </div>

        <div
          v-else-if="pagosRecientes.length === 0"
          class="empty-state"
        >
          <span>◷</span>
          <p>Sin movimientos recientes</p>
          <small>No hay pagos registrados.</small>
        </div>

        <div v-else class="recent-list">

          <div
            v-for="pago in pagosPaginados"
            :key="pago.pagoId"
            class="recent-item"
          >
            <div class="recent-item-main">
              <div class="recent-icon payment-icon">✓</div>

              <div class="recent-details">
                <strong>Pago #{{ pago.pagoId }}</strong>
                <span>{{ pago.nombreProveedor }}</span>

                <small>
                  {{ pago.numeroFactura }} ·
                  {{ formatoFecha(pago.fechaPago) }}
                </small>
              </div>
            </div>

            <div class="recent-item-right">
              <strong
                :class="{ 'cancelled-amount': pago.anulado }"
              >
                {{ formatoMoneda(pago.monto) }}
              </strong>

              <span
                class="status-badge"
                :class="pago.anulado
                  ? 'status-cancelled'
                  : 'status-paid'"
              >
                {{ pago.anulado ? 'Anulado' : 'Válido' }}
              </span>
                      </div>
          </div>
        </div>

        <!-- PAGINACIÓN DE PAGOS: PEGAR AQUÍ -->
        <div v-if="pagosRecientes.length > 0" class="pagination-container">
          <span class="pagination-info">
            Mostrando
            {{ (paginaPagos - 1) * registrosPorPagina + 1 }}
            -
            {{ Math.min(paginaPagos * registrosPorPagina, pagosRecientes.length) }}
            de {{ pagosRecientes.length }} pagos
          </span>

          <div class="pagination-buttons">
            <button
              type="button"
              class="pagination-btn"
              :disabled="paginaPagos === 1"
              @click="cambiarPaginaPagos(paginaPagos - 1)"
            >
              ‹ Anterior
            </button>

            <span class="pagination-current">
              Página {{ paginaPagos }} de {{ totalPaginasPagos }}
            </span>

            <button
              type="button"
              class="pagination-btn"
              :disabled="paginaPagos === totalPaginasPagos"
              @click="cambiarPaginaPagos(paginaPagos + 1)"
            >
              Siguiente ›
            </button>
          </div>

        </div>

      </article>

    </section>

  </main>
</template>

<style scoped>
/* Contenedor principal */
.dashboard {
  min-height: 100vh;
  padding: 36px;
  background: #f8f5fc;
  font-family: 'Segoe UI', Arial, sans-serif;
}

/* Encabezado */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.dashboard-header h1 {
  margin: 0 0 8px;
  color: #33234d;
  font-size: 30px;
}

.dashboard-header p {
  margin: 0;
  color: #89799d;
  font-size: 14px;
}

.dashboard-label {
  padding: 10px 18px;
  background: #eee5f7;
  color: #7551a7;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

/* Mensaje de error */
.error-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 14px 18px;
  background: #fff4f4;
  border: 1px solid #f2caca;
  border-radius: 12px;
  color: #a33232;
  font-size: 13px;
}

.error-message button {
  border: 1px solid #e5b4b4;
  background: white;
  color: #a33232;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
}

.error-message button:hover {
  background: #ffe7e7;
}

/* Alertas de vencimiento */
.alerts-section {
  margin-bottom: 28px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #eee5f7;
  border-radius: 16px;
  box-shadow: 0 5px 18px rgba(73, 48, 120, 0.04);
}

.alerts-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.alerts-heading h2 {
  margin: 0 0 6px;
  color: #33234d;
  font-size: 19px;
}

.alerts-heading p {
  margin: 0;
  color: #89799d;
  font-size: 13px;
}

.alerts-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #eee5f7;
  color: #7551a7;
  font-size: 22px;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.alert-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid #eee5f7;
  border-radius: 13px;
  background: #fdfbff;
}

.alert-upcoming {
  border-left: 4px solid #a17acb;
}

.alert-overdue {
  border-left: 4px solid #c46a78;
}

.alert-card-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.alert-card-heading > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.alert-kicker {
  color: #89799d;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.alert-card-heading strong {
  color: #493078;
  font-size: 25px;
}

.alert-status {
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.upcoming-status {
  background: #f0e7fa;
  color: #7551a7;
}

.overdue-status {
  background: #fff0f0;
  color: #a94355;
}

.alert-no-items,
.alerts-empty {
  padding: 18px 10px;
  color: #89799d;
  font-size: 13px;
  text-align: center;
}

.alert-list {
  display: flex;
  flex-direction: column;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #f0e9f7;
}

.alert-item-details,
.alert-item-amount {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.alert-item-details strong {
  color: #493078;
  font-size: 12px;
}

.alert-item-details span {
  color: #89799d;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.alert-item-details small,
.alert-item-amount small {
  color: #a69bb2;
  font-size: 10px;
}

.alert-item-amount {
  align-items: flex-end;
  flex-shrink: 0;
  text-align: right;
}

.alert-item-amount strong {
  color: #493078;
  font-size: 12px;
}

.alerts-note {
  margin: 12px 0 0;
  color: #a94355;
  font-size: 12px;
}

/* Tarjetas estadísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  background: white;
  border: 1px solid #eee5f7;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 5px 18px rgba(73, 48, 120, 0.04);
  min-width: 0;
}

.stat-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: #eee5f7;
  color: #7551a7;
  border-radius: 12px;
  font-size: 23px;
  margin-bottom: 20px;
}

.stat-card p {
  color: #89799d;
  font-size: 14px;
  margin: 0;
}

.stat-card h2 {
  font-size: clamp(22px, 2vw, 30px);
  color: #493078;
  margin: 12px 0;
  overflow-wrap: anywhere;
}

.stat-card span {
  color: #a69bb2;
  font-size: 12px;
}

/* Gráficas */
.charts-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
}

.chart-card {
  min-height: 390px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.year-select {
  border: 1px solid #e5dcef;
  border-radius: 9px;
  background: #f8f5fc;
  color: #493078;
  padding: 9px 12px;
  font-weight: 600;
  cursor: pointer;
}

.chart-container {
  position: relative;
  height: 290px;
  margin-top: 20px;
}

.doughnut-container {
  height: 270px;
}

.chart-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 8px;
  gap: 3px;
}

.chart-summary strong {
  color: #493078;
  font-size: 21px;
}

.chart-summary span {
  color: #89799d;
  font-size: 12px;
}

.chart-message {
  min-height: 290px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #89799d;
  font-size: 14px;
}

.retry-button {
  margin-top: 12px;
  padding: 9px 15px;
  border: 1px solid #d9c5ee;
  border-radius: 8px;
  background: #eee5f7;
  color: #493078;
  font-weight: 600;
  cursor: pointer;
}

/* Secciones inferiores */
.dashboard-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.content-card {
  background: white;
  border: 1px solid #eee5f7;
  border-radius: 16px;
  padding: 26px;
  min-width: 0;
}

.content-card h3 {
  color: #33234d;
  font-size: 18px;
  margin: 0 0 8px;
}

.card-description {
  color: #89799d;
  font-size: 13px;
}

/* Encabezados de las secciones recientes */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.section-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: #eee5f7;
  border-radius: 10px;
  color: #7551a7;
  font-size: 20px;
}

/* Listas de facturas y pagos */
.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid #f0e9f7;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-item-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.recent-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 11px;
  background: #eee5f7;
  color: #7551a7;
  font-size: 20px;
}

.payment-icon {
  background: #f0e8f9;
}

.recent-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.recent-details strong {
  color: #493078;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.recent-details span {
  color: #89799d;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.recent-details small {
  color: #a69bb2;
  font-size: 11px;
}

.recent-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7px;
  flex-shrink: 0;
  text-align: right;
}

.recent-item-right strong {
  color: #493078;
  font-size: 13px;
}

.status-badge {
  padding: 5px 9px;
  border-radius: 20px;
  background: #f0e7fa;
  color: #7551a7;
  font-size: 11px;
  font-weight: 600;
}

.status-paid {
  background: #e9f7ee;
  color: #287849;
}

.status-overdue,
.status-cancelled {
  background: #fff0f0;
  color: #b33c3c;
}

.cancelled-amount {
  text-decoration: line-through;
  opacity: 0.65;
}

/* Estados vacíos */
.empty-state {
  min-height: 230px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-state span {
  color: #b79ad9;
  font-size: 35px;
}

.empty-state p {
  color: #493078;
  font-weight: 600;
  margin-bottom: 5px;
}

.empty-state small {
  color: #a69bb2;
}

/* Pantallas medianas */
@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

/* Celulares */
@media (max-width: 650px) {
  .dashboard {
    padding: 20px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid,
  .charts-grid,
  .dashboard-content,
  .alerts-grid {
    grid-template-columns: 1fr;
  }

  .chart-header {
    flex-direction: column;
  }

  .recent-item {
    align-items: flex-start;
  }

  .recent-item-right {
    max-width: 45%;
  }

  .error-message {
    flex-direction: column;
    align-items: flex-start;
  }
}
/* =========================================
   PAGINACIÓN DEL DASHBOARD
   ========================================= */

.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #ebe3f5;
}

.pagination-info {
  color: #826d99;
  font-size: 12px;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-btn {
  padding: 9px 12px;
  border: 1px solid #e5d9f0;
  border-radius: 9px;
  background: #f3ecfa;
  color: #7950ae;
  font-size: 12px;
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
  font-size: 12px;
  font-weight: 600;
}
</style>
