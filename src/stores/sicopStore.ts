
import { computed, ref } from 'vue'
import { apiGet } from '@/services/api'

export interface ProveedorOpcion {
  proveedorId: number
  nombre: string
  activo: boolean
}

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

export interface FacturaFormulario {
  facturaCompraId?: number
  proveedorId: number
  numeroFactura: string
  fechaEmision: string
  fechaVencimiento: string
  total: number
  observaciones: string
}

export interface Pago {
  pagoId: number
  facturaCompraId: number
  fechaPago: string
  monto: number
  metodoPago: string
  referencia: string
  observaciones: string
  anulado: boolean
  fechaAnulacion: string | null
  motivoAnulacion: string | null
}

export interface PagoFormulario {
  facturaCompraId: number
  fechaPago: string
  monto: number
  metodoPago: string
  referencia: string
  observaciones: string
}

export const proveedores = ref<ProveedorOpcion[]>([])

interface ProveedorRespuestaDto {
  proveedorId: number
  nombre: string
  activo: boolean
}

export async function cargarProveedoresFacturas(): Promise<void> {
  const respuesta = await apiGet<ProveedorRespuestaDto[]>(
    '/api/Proveedores'
  )

  proveedores.value = respuesta.map(proveedor => ({
    proveedorId: proveedor.proveedorId,
    nombre: proveedor.nombre,
    activo: proveedor.activo
  }))
}

export const facturas = ref<FacturaCompra[]>([])

interface SaldoFacturaRespuestaDto {
  facturaCompraId: number
  total: number
  totalPagado: number
  saldoPendiente: number
}

export async function cargarFacturas(): Promise<void> {
  const respuesta = await apiGet<FacturaCompraRespuestaDto[]>(
    '/api/FacturasCompras'
  )

  const facturasConSaldo = await Promise.all(
    respuesta.map(async factura => {
      const saldo = await apiGet<SaldoFacturaRespuestaDto>(
        `/api/FacturasCompras/${factura.facturaCompraId}/saldo`
      )

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
        saldoPendiente: saldo.saldoPendiente,
        anulada: factura.anulada,
        fechaAnulacion: factura.fechaAnulacion,
        motivoAnulacion: factura.motivoAnulacion,
        anuladaPorUsuarioId: factura.anuladaPorUsuarioId
      }
    })
  )

  facturas.value = facturasConSaldo
}

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

export const pagos = ref<Pago[]>([])

export async function cargarPagos(): Promise<void> {
  const respuesta = await apiGet<PagoRespuestaDto[]>(
    '/api/Pagos'
  )

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

function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

export function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ'
  }).format(valor)
}

export function formatoFecha(fecha: string): string {
  if (!fecha) {
    return '—'
  }

  const fechaSinHora = fecha.split('T')[0] ?? ''

  const [anio, mes, dia] = fechaSinHora.split('-')

  if (!anio || !mes || !dia) {
    return fecha
  }

  return `${dia}/${mes}/${anio}`
}

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

export function actualizarSaldos(): void {
  facturas.value.forEach(factura => {
    factura.saldoPendiente =
      obtenerSaldoPendiente(factura.facturaCompraId)
  })
}

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
    anulado: false,
    fechaAnulacion: null,
    motivoAnulacion: null
  })

  actualizarSaldos()
}

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

export const totalFacturasPagadas = computed(
  () => facturas.value.filter(
    factura =>
      !factura.anulada &&
      factura.saldoPendiente <= 0
  ).length
)
