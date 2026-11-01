
import { computed, ref } from 'vue'
// Conexión con el backend ASP.NET Core.
import { apiGet } from '@/services/api'


// =============================================
// ESTRUCTURAS DE DATOS DEL SISTEMA
// =============================================

// Información del proveedor disponible en SICOP.
export interface ProveedorOpcion {
  proveedorId: number
  nombre: string
  activo: boolean
}

// Datos de una factura de compra.
export interface FacturaCompra {
  facturaCompraId: number
  proveedorId: number
  numeroFactura: string
  fechaEmision: string
  fechaVencimiento: string
  total: number
  observaciones: string
  nombreProveedor: string
  saldoPendiente: number
  anulada: boolean
  fechaAnulacion: string | null
  motivoAnulacion: string | null
  anuladaPorUsuarioId: number | null
}

// Datos que devuelve GET /api/FacturasCompras.
interface FacturaCompraRespuestaDto {
  facturaCompraId: number
  proveedorId: number
  numeroFactura: string
  fechaEmision: string
  fechaVencimiento: string
  total: number
  observaciones: string | null
  anulada: boolean
  fechaAnulacion: string | null
  motivoAnulacion: string | null
  anuladaPorUsuarioId: number | null
}

// Datos necesarios para registrar una factura.
export interface FacturaFormulario {
  facturaCompraId?: number
  proveedorId: number
  numeroFactura: string
  fechaEmision: string
  fechaVencimiento: string
  total: number
  observaciones: string
}

// Información de un pago registrado.
export interface Pago {
  pagoId: number
  facturaCompraId: number
  fechaPago: string
  monto: number
  metodoPago: string
  referencia: string
  observaciones: string

  // Datos de anulación controlados por el backend.
  anulado: boolean
  fechaAnulacion: string | null
  motivoAnulacion: string | null
}

// Datos para registrar un nuevo pago.
export interface PagoFormulario {
  facturaCompraId: number
  fechaPago: string
  monto: number
  metodoPago: string
  referencia: string
  observaciones: string
}

// =============================================
// PROVEEDORES OBTENIDOS DESDE SQL SERVER
// =============================================

// Lista compartida con el formulario de facturas.
export const proveedores = ref<ProveedorOpcion[]>([])

// Estructura recibida desde GET /api/Proveedores.
interface ProveedorRespuestaDto {
  proveedorId: number
  nombre: string
  activo: boolean
}

// Consultar proveedores reales.
export async function cargarProveedoresFacturas(): Promise<void> {

  // Obtener los proveedores desde ASP.NET Core.
  const respuesta = await apiGet<ProveedorRespuestaDto[]>(
    '/api/Proveedores'
  )

  // Conservar proveedores activos e inactivos.
// Los inactivos pueden tener facturas históricas.
proveedores.value = respuesta.map(proveedor => ({
  proveedorId: proveedor.proveedorId,
  nombre: proveedor.nombre,
  activo: proveedor.activo
}))
}

// =============================================
// FACTURAS OBTENIDAS DESDE SQL SERVER
// =============================================

// Al iniciar, no mostramos facturas de demostración.
// Los registros se cargarán desde la API .NET.
export const facturas = ref<FacturaCompra[]>([])

// Estructura del saldo calculado por el backend.
interface SaldoFacturaRespuestaDto {
  facturaCompraId: number
  total: number
  totalPagado: number
  saldoPendiente: number
}

// Consultar las facturas reales y sus saldos.
export async function cargarFacturas(): Promise<void> {

  // Obtener las facturas registradas en SQL Server.
  const respuesta = await apiGet<FacturaCompraRespuestaDto[]>(
    '/api/FacturasCompras'
  )

  // Consultar el saldo real de cada factura.
  const facturasConSaldo = await Promise.all(
    respuesta.map(async factura => {

      const saldo = await apiGet<SaldoFacturaRespuestaDto>(
        `/api/FacturasCompras/${factura.facturaCompraId}/saldo`
      )

      // Identificar el proveedor de la factura.
      const proveedor = proveedores.value.find(
        item => item.proveedorId === factura.proveedorId
      )

      return {
        facturaCompraId: factura.facturaCompraId,
        proveedorId: factura.proveedorId,
        numeroFactura: factura.numeroFactura,
        fechaEmision: factura.fechaEmision,
        fechaVencimiento: factura.fechaVencimiento,
        total: factura.total,
        observaciones: factura.observaciones ?? '',
        nombreProveedor: proveedor?.nombre ?? 'Proveedor no encontrado',

        // Saldo calculado por FacturaService en .NET.
        saldoPendiente: saldo.saldoPendiente,

        // Información real de anulación.
        anulada: factura.anulada,
        fechaAnulacion: factura.fechaAnulacion,
        motivoAnulacion: factura.motivoAnulacion,
        anuladaPorUsuarioId: factura.anuladaPorUsuarioId
      }
    })
  )

  // Actualizar la lista compartida con datos reales.
  facturas.value = facturasConSaldo
}

// =============================================
// PAGOS OBTENIDOS DESDE SQL SERVER
// =============================================

// Estructura que devuelve GET /api/Pagos.
interface PagoRespuestaDto {
  pagoId: number
  facturaCompraId: number
  fechaPago: string
  monto: number
  metodoPago: string
  referencia: string | null
  observaciones: string | null
  anulado: boolean
  fechaAnulacion: string | null
  motivoAnulacion: string | null
}

// Lista compartida de pagos reales.
export const pagos = ref<Pago[]>([])

// Consultar los pagos registrados en SQL Server.
export async function cargarPagos(): Promise<void> {

  // Obtener los pagos desde ASP.NET Core.
  const respuesta = await apiGet<PagoRespuestaDto[]>(
    '/api/Pagos'
  )

  // Convertir la respuesta en datos para el frontend.
  pagos.value = respuesta.map(pago => ({
    pagoId: pago.pagoId,
    facturaCompraId: pago.facturaCompraId,
    fechaPago: pago.fechaPago,
    monto: pago.monto,
    metodoPago: pago.metodoPago,
    referencia: pago.referencia ?? '',
    observaciones: pago.observaciones ?? '',
    anulado: pago.anulado,
    fechaAnulacion: pago.fechaAnulacion,
    motivoAnulacion: pago.motivoAnulacion
  }))
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

// Redondear cantidades monetarias a centavos.
function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

// Mostrar los montos en quetzales.
export function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ'
  }).format(valor)
}

// Mostrar fechas de SQL Server en formato día/mes/año.
export function formatoFecha(fecha: string): string {

  if (!fecha) {
    return '—'
  }

  // Obtener únicamente la fecha, sin la hora.
  const fechaSinHora = fecha.split('T')[0] ?? ''

  const [anio, mes, dia] = fechaSinHora.split('-')

  if (!anio || !mes || !dia) {
    return fecha
  }

  return `${dia}/${mes}/${anio}`
}

// =============================================
// CONSULTAS DE PAGOS Y SALDOS
// =============================================

// Calcular cuánto se ha pagado de una factura.
// No se incluyen los pagos anulados.
export function obtenerMontoPagado(
  facturaCompraId: number
): number {
  const totalPagado = pagos.value
    .filter(
      pago =>
        pago.facturaCompraId === facturaCompraId &&
        !pago.anulado
    )
    .reduce(
      (suma, pago) => suma + pago.monto,
      0
    )

  return redondear(totalPagado)
}

// Calcular cuánto falta por pagar.
export function obtenerSaldoPendiente(
  facturaCompraId: number
): number {
  const factura = facturas.value.find(
    item => item.facturaCompraId === facturaCompraId
  )

  if (!factura) {
    return 0
  }

  return Math.max(
    0,
    redondear(
      factura.total -
      obtenerMontoPagado(facturaCompraId)
    )
  )
}

// Actualizar los saldos de las facturas.
export function actualizarSaldos(): void {
  facturas.value.forEach(factura => {
    factura.saldoPendiente =
      obtenerSaldoPendiente(factura.facturaCompraId)
  })
}

// =============================================
// REGISTRAR PAGOS
// =============================================

export function registrarPago(
  datos: PagoFormulario
): void {
  const factura = facturas.value.find(
    item =>
      item.facturaCompraId === datos.facturaCompraId
  )

  if (!factura) {
    throw new Error('Seleccione una factura válida.')
  }

  if (!datos.fechaPago) {
    throw new Error('Seleccione la fecha del pago.')
  }

  if (
    !Number.isFinite(datos.monto) ||
    datos.monto <= 0
  ) {
    throw new Error(
      'El monto del pago debe ser mayor que cero.'
    )
  }

  const monto = redondear(datos.monto)
  const saldo = obtenerSaldoPendiente(
    datos.facturaCompraId
  )

  // Evitar pagos superiores al saldo pendiente.
  if (monto > saldo) {
    throw new Error(
      `El pago no puede superar el saldo pendiente de ${formatoMoneda(saldo)}.`
    )
  }

  const nuevoId = pagos.value.length > 0
    ? Math.max(
        ...pagos.value.map(pago => pago.pagoId)
      ) + 1
    : 1

  pagos.value.push({
  pagoId: nuevoId,
  facturaCompraId: datos.facturaCompraId,
  fechaPago: datos.fechaPago,
  monto,
  metodoPago: datos.metodoPago,
  referencia: datos.referencia.trim(),
  observaciones: datos.observaciones.trim(),

  // Valores iniciales para mantener la estructura.
  anulado: false,
  fechaAnulacion: null,
  motivoAnulacion: null
})

  // Reflejar el abono en el módulo Facturas.
  actualizarSaldos()
}

// =============================================
// INDICADORES GENERALES
// =============================================

export const totalFacturas = computed(
  () => facturas.value.length
)

export const montoTotalFacturado = computed(
  () => redondear(
    facturas.value.reduce(
      (suma, factura) => suma + factura.total,
      0
    )
  )
)

// Sumar únicamente los saldos de facturas vigentes.
export const saldoTotalPendiente = computed(
  () => redondear(
    facturas.value
      .filter(factura => !factura.anulada)
      .reduce(
        (suma, factura) => suma + factura.saldoPendiente,
        0
      )
  )
)

// Contar solamente las facturas pagadas y no anuladas.
export const totalFacturasPagadas = computed(
  () => facturas.value.filter(
    factura =>
      !factura.anulada &&
      factura.saldoPendiente <= 0
  ).length
)

