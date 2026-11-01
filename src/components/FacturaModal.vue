
<script setup lang="ts">
import { reactive, watch } from 'vue'

interface FacturaFormulario {
  facturaCompraId?: number
  proveedorId: number
  numeroFactura: string
  fechaEmision: string
  fechaVencimiento: string
  total: number
  observaciones: string
}

interface ProveedorOpcion {
  proveedorId: number
  nombre: string
}

const props = defineProps<{
  visible: boolean
  factura?: FacturaFormulario | null
  proveedores: ProveedorOpcion[]
}>()

const emit = defineEmits<{
  cerrar: []
  guardar: [factura: FacturaFormulario]
}>()

const formulario = reactive<FacturaFormulario>({
  proveedorId: 0,
  numeroFactura: '',
  fechaEmision: '',
  fechaVencimiento: '',
  total: 0,
  observaciones: ''
})

watch(
  () => [props.visible, props.factura] as const,
  () => {
    if (!props.visible) return

    formulario.facturaCompraId =
      props.factura?.facturaCompraId

    formulario.proveedorId =
      props.factura?.proveedorId ?? 0

    formulario.numeroFactura =
      props.factura?.numeroFactura ?? ''

    formulario.fechaEmision =
      props.factura?.fechaEmision ?? ''

    formulario.fechaVencimiento =
      props.factura?.fechaVencimiento ?? ''

    formulario.total =
      props.factura?.total ?? 0

    formulario.observaciones =
      props.factura?.observaciones ?? ''
  },
  { immediate: true }
)

function guardarFactura() {
  if (formulario.proveedorId <= 0) {
    alert('Debe seleccionar un proveedor.')
    return
  }

  if (formulario.total <= 0) {
    alert('El monto total debe ser mayor que cero.')
    return
  }

  if (
    formulario.fechaVencimiento <
    formulario.fechaEmision
  ) {
    alert(
      'La fecha de vencimiento no puede ser anterior a la fecha de emisión.'
    )
    return
  }

  emit('guardar', { ...formulario })
}
</script>

<template>
  <div
    v-if="visible"
    class="modal-overlay"
    @click.self="emit('cerrar')"
  >
    <section
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="factura-modal-titulo"
    >
      <header class="modal-header">
        <div>
          <span class="modal-label">
            CUENTAS POR PAGAR
          </span>

          <h2 id="factura-modal-titulo">
            {{
              factura
                ? 'Editar factura'
                : 'Nueva factura'
            }}
          </h2>

          <p>
            Completa la información de la factura de compra.
          </p>
        </div>

        <button
          type="button"
          class="close-button"
          aria-label="Cerrar formulario"
          @click="emit('cerrar')"
        >
          ×
        </button>
      </header>

      <form
        class="modal-form"
        @submit.prevent="guardarFactura"
      >
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="factura-proveedor">
                Proveedor *
              </label>

              <select
                id="factura-proveedor"
                v-model.number="formulario.proveedorId"
                required
              >
                <option :value="0" disabled>
                  Seleccione un proveedor
                </option>

                <option
                  v-for="proveedor in proveedores"
                  :key="proveedor.proveedorId"
                  :value="proveedor.proveedorId"
                >
                  {{ proveedor.nombre }}
                </option>
              </select>
            </div>

            <div class="form-group full-width">
              <label for="factura-numero">
                Número de factura *
              </label>

              <input
                id="factura-numero"
                v-model.trim="formulario.numeroFactura"
                type="text"
                placeholder="Ejemplo: FAC-004"
                maxlength="50"
                required
              />
            </div>

            <div class="form-group">
              <label for="factura-emision">
                Fecha de emisión *
              </label>

              <input
                id="factura-emision"
                v-model="formulario.fechaEmision"
                type="date"
                required
              />
            </div>

            <div class="form-group">
              <label for="factura-vencimiento">
                Fecha de vencimiento *
              </label>

              <input
                id="factura-vencimiento"
                v-model="formulario.fechaVencimiento"
                :min="formulario.fechaEmision || undefined"
                type="date"
                required
              />
            </div>

            <div class="form-group full-width">
              <label for="factura-total">
                Monto total (Q) *
              </label>

              <input
                id="factura-total"
                v-model.number="formulario.total"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ejemplo: 1500.00"
                required
              />
            </div>

            <div class="form-group full-width">
              <label for="factura-observaciones">
                Observaciones
              </label>

              <textarea
                id="factura-observaciones"
                v-model.trim="formulario.observaciones"
                rows="3"
                placeholder="Descripción o detalles de la compra"
              ></textarea>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button
            type="button"
            class="btn-cancel"
            @click="emit('cerrar')"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="btn-save"
          >
            {{
              factura
                ? 'Guardar cambios'
                : 'Registrar factura'
            }}
          </button>
        </footer>
      </form>
    </section>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(35, 20, 59, 0.55);
  backdrop-filter: blur(5px);
}

.modal-card {
  display: flex;
  flex-direction: column;

  width: 100%;
  max-width: 650px;
  max-height: min(90vh, 800px);

  box-sizing: border-box;
  overflow: hidden;

  background: #ffffff;
  border: 1px solid #e9def4;
  border-radius: 22px;

  box-shadow: 0 24px 70px rgba(45, 25, 75, 0.2);

  font-family: Arial, sans-serif;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 20px;
  flex-shrink: 0;

  padding: 28px 32px 22px;

  border-bottom: 1px solid #f0e9f6;
  background: #ffffff;
}

.modal-label {
  color: #946bbb;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
}

.modal-header h2 {
  margin: 10px 0;
  color: #352057;
  font-size: 26px;
}

.modal-header p {
  margin: 0;
  color: #9681aa;
  font-size: 14px;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 36px;
  height: 36px;
  flex-shrink: 0;

  border: none;
  border-radius: 10px;

  background: #f1e9f9;
  color: #7950ae;

  font-size: 26px;
  cursor: pointer;
}

.close-button:hover {
  background: #e8d9f5;
}

.modal-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.modal-body {
  flex: 1;
  min-height: 0;

  overflow-y: auto;
  overscroll-behavior: contain;

  padding: 26px 32px;
}

.modal-body::-webkit-scrollbar {
  width: 7px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #c8b1df;
  border-radius: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-width: 0;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  color: #493078;
  font-size: 13px;
  font-weight: 700;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  box-sizing: border-box;

  padding: 13px 15px;

  border: 1px solid #e5d9f0;
  border-radius: 11px;

  background: #fcfaff;
  color: #352057;

  font: inherit;
  font-size: 14px;

  outline: none;

  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #946bbb;
  box-shadow: 0 0 0 3px rgba(148, 107, 187, 0.12);
}

.form-group textarea {
  resize: vertical;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap: 12px;
  flex-shrink: 0;

  padding: 20px 32px;

  border-top: 1px solid #f0e9f6;
  background: #ffffff;
}

.btn-cancel,
.btn-save {
  padding: 13px 20px;
  border-radius: 11px;

  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel {
  border: 1px solid #e5d9f0;
  background: #ffffff;
  color: #7950ae;
}

.btn-cancel:hover {
  background: #f8f5fc;
}

.btn-save {
  border: none;
  background: #7950ae;
  color: #ffffff;
}

.btn-save:hover {
  background: #633e96;
}

@media (max-width: 600px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal-card {
    max-height: 94vh;
  }

  .modal-header {
    padding: 22px 20px 18px;
  }

  .modal-header h2 {
    font-size: 22px;
  }

  .modal-body {
    padding: 22px 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
    padding: 16px 20px;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
  }
}
</style>
