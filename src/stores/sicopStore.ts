
import { computed, ref } from 'vue'

// =============================================
// ESTRUCTURAS DE DATOS DEL SISTEMA
// =============================================

// Información básica del proveedor.
export interface ProveedorOpcion {
  proveedorId: number
  nombre: string
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

// Información de un pago.
export interface Pago {
  pagoId: number
  facturaCompraId: number
  fechaPago: string
  monto: number
  metodoPago: string
  referencia: string
  observaciones: string
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
// DATOS TEMPORALES DE PROVEEDORES
// =============================================

export const proveedores = ref<ProveedorOpcion[]>([
  {
    proveedorId: 1,
    nombre: 'Distribuidora Central'
  },
  {
    proveedorId: 2,
    nombre: 'Comercial La Esperanza'
  },
  {
    proveedorId: 3,
    nombre: 'Suministros del Sur'
  }
])

// =============================================
// DATOS TEMPORALES DE FACTURAS
// =============================================

// Estos datos serán sustituidos posteriormente
// por consultas al backend ASP.NET Core.
export const facturas = ref<FacturaCompra[]>([
  {
    facturaCompraId: 1,
    proveedorId: 1,
    numeroFactura: 'FAC-001',
    fechaEmision: '2026-10-01',
    fechaVencimiento: '2026-11-01',
    total: 4500,
    observaciones: 'Compra de suministros',
    nombreProveedor: 'Distribuidora Central',
    saldoPendiente: 4500
  },
  {
    facturaCompraId: 2,
    proveedorId: 2,
    numeroFactura: 'FAC-002',
    fechaEmision: '2026-10-05',
    fechaVencimiento: '2026-11-05',
    total: 3200,
    observaciones: 'Compra de materiales',
    nombreProveedor: 'Comercial La Esperanza',
    saldoPendiente: 1200
  },
  {
    facturaCompraId: 3,
    proveedorId: 3,
    numeroFactura: 'FAC-003',
    fechaEmision: '2026-10-10',
    fechaVencimiento: '2026-11-10',
    total: 1850,
    observaciones: 'Compra de artículos',
    nombreProveedor: 'Suministros del Sur',
    saldoPendiente: 0
  }
])

// =============================================
// DATOS TEMPORALES DE PAGOS
// =============================================

// Registramos pagos de demostración para que
// coincidan con los saldos iniciales.
//
// FAC-002: Q3,200 - Q2,000 = Q1,200.
// FAC-003: Q1,850 - Q1,850 = Q0.

export const pagos = ref<Pago[]>([
  {
    pagoId: 1,
    facturaCompraId: 2,
    fechaPago: '2026-10-15',
    monto: 2000,
    metodoPago: 'Transferencia',
    referencia: 'TRF-001',
    observaciones: 'Primer abono'
  },
  {
    pagoId: 2,
    facturaCompraId: 3,
    fechaPago: '2026-10-20',
    monto: 1850,
    metodoPago: 'Efectivo',
    referencia: 'PAG-002',
    observaciones: 'Pago completo'
  }
])

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

// Mostrar las fechas como día/mes/año.
export function formatoFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-')

  if (!anio || !mes || !dia) {
    return fecha
  }

  return `${dia}/${mes}/${anio}`
}

// =============================================
// CONSULTAS DE PAGOS Y SALDOS
// =============================================

// Calcular cuánto se ha pagado de una factura.
export function obtenerMontoPagado(
  facturaCompraId: number
): number {
  const totalPagado = pagos.value
    .filter(
      pago => pago.facturaCompraId === facturaCompraId
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
// REGISTRO Y EDICIÓN DE FACTURAS
// =============================================

export function guardarFactura(
  datos: FacturaFormulario
): void {
  const proveedor = proveedores.value.find(
    item => item.proveedorId === datos.proveedorId
  )

  if (!proveedor) {
    throw new Error('Seleccione un proveedor válido.')
  }

  if (
    !datos.numeroFactura.trim() ||
    !Number.isFinite(datos.total) ||
    datos.total <= 0
  ) {
    throw new Error(
      'Ingrese un número de factura y un monto válido.'
    )
  }

  if (
    !datos.fechaEmision ||
    !datos.fechaVencimiento ||
    datos.fechaVencimiento < datos.fechaEmision
  ) {
    throw new Error(
      'Verifique las fechas de la factura.'
    )
  }

  // Evitar números duplicados para el mismo proveedor.
  const duplicada = facturas.value.some(
    factura =>
      factura.proveedorId === datos.proveedorId &&
      factura.numeroFactura.trim().toLowerCase() ===
        datos.numeroFactura.trim().toLowerCase() &&
      factura.facturaCompraId !== datos.facturaCompraId
  )

  if (duplicada) {
    throw new Error(
      'Ya existe una factura con ese número para el proveedor.'
    )
  }

  const total = redondear(datos.total)

  // Editar una factura existente.
  if (datos.facturaCompraId !== undefined) {
    const factura = facturas.value.find(
      item =>
        item.facturaCompraId === datos.facturaCompraId
    )

    if (!factura) {
      throw new Error('No se encontró la factura.')
    }

    const montoPagado = obtenerMontoPagado(
      factura.facturaCompraId
    )

    // No permitir reducir el total por debajo
    // del dinero que ya se ha pagado.
    if (total < montoPagado) {
      throw new Error(
        `El total no puede ser menor al monto pagado: ${formatoMoneda(montoPagado)}.`
      )
    }

    factura.proveedorId = datos.proveedorId
    factura.nombreProveedor = proveedor.nombre
    factura.numeroFactura = datos.numeroFactura.trim()
    factura.fechaEmision = datos.fechaEmision
    factura.fechaVencimiento = datos.fechaVencimiento
    factura.total = total
    factura.observaciones = datos.observaciones

    actualizarSaldos()
    return
  }

  // Registrar una nueva factura.
  const nuevoId = facturas.value.length > 0
    ? Math.max(
        ...facturas.value.map(
          factura => factura.facturaCompraId
        )
      ) + 1
    : 1

  facturas.value.push({
    facturaCompraId: nuevoId,
    proveedorId: datos.proveedorId,
    nombreProveedor: proveedor.nombre,
    numeroFactura: datos.numeroFactura.trim(),
    fechaEmision: datos.fechaEmision,
    fechaVencimiento: datos.fechaVencimiento,
    total,
    observaciones: datos.observaciones,
    saldoPendiente: total
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
    observaciones: datos.observaciones.trim()
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

export const saldoTotalPendiente = computed(
  () => redondear(
    facturas.value.reduce(
      (suma, factura) => suma + factura.saldoPendiente,
      0
    )
  )
)

export const totalFacturasPagadas = computed(
  () => facturas.value.filter(
    factura => factura.saldoPendiente <= 0
  ).length
)

// Sincronizar los saldos iniciales con los pagos.
actualizarSaldos()
