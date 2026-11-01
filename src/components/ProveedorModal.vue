
<script setup lang="ts">
import { reactive, watch } from 'vue'

// =============================================
// ESTRUCTURA DE LOS DATOS DEL PROVEEDOR
// =============================================

interface ProveedorFormulario {
  proveedorId?: number
  nombre: string
  nit: string
  telefono: string
  correo: string
  direccion: string
  activo: boolean
}

// =============================================
// PROPIEDADES RECIBIDAS DESDE LA VISTA
// =============================================

const props = defineProps<{
  visible: boolean
  proveedor?: ProveedorFormulario | null
}>()

// Eventos enviados a ProveedoresView.vue.
const emit = defineEmits<{
  cerrar: []
  guardar: [proveedor: ProveedorFormulario]
}>()

// =============================================
// DATOS DEL FORMULARIO
// =============================================

const formulario = reactive<ProveedorFormulario>({
  nombre: '',
  nit: '',
  telefono: '',
  correo: '',
  direccion: '',
  activo: true
})

// =============================================
// PREPARAR FORMULARIO AL ABRIRLO
// =============================================

// Si existe un proveedor, cargamos sus datos.
// Si no existe, limpiamos los campos para registrar.
watch(
  () => [props.visible, props.proveedor] as const,
  () => {
    if (!props.visible) return

    formulario.proveedorId = props.proveedor?.proveedorId
    formulario.nombre = props.proveedor?.nombre ?? ''
    formulario.nit = props.proveedor?.nit ?? ''
    formulario.telefono = props.proveedor?.telefono ?? ''
    formulario.correo = props.proveedor?.correo ?? ''
    formulario.direccion = props.proveedor?.direccion ?? ''
    formulario.activo = props.proveedor?.activo ?? true
  },
  { immediate: true }
)

// =============================================
// GUARDAR PROVEEDOR
// =============================================

// El formulario envía los datos a la vista principal.
// Todavía no realizamos peticiones al backend.
function guardarProveedor() {
  emit('guardar', { ...formulario })
}
</script>

<template>
  <!-- ====================================== -->
  <!-- FONDO DE LA VENTANA MODAL              -->
  <!-- ====================================== -->

  <div
    v-if="visible"
    class="modal-overlay"
    @click.self="emit('cerrar')"
  >
    <section
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >

      <!-- ====================================== -->
      <!-- ENCABEZADO FIJO                       -->
      <!-- ====================================== -->

      <header class="modal-header">
        <div>
          <span class="modal-label">
            ADMINISTRACIÓN
          </span>

          <h2 id="modal-titulo">
            {{
              proveedor
                ? 'Editar proveedor'
                : 'Nuevo proveedor'
            }}
          </h2>

          <p>
            Completa la información del proveedor.
          </p>
        </div>

        <!-- Cerrar ventana -->
        <button
          class="close-button"
          type="button"
          aria-label="Cerrar formulario"
          @click="emit('cerrar')"
        >
          ×
        </button>
      </header>

      <!-- ====================================== -->
      <!-- FORMULARIO                           -->
      <!-- ====================================== -->

      <form
        id="form-proveedor"
        class="modal-form"
        @submit.prevent="guardarProveedor"
      >

        <!-- ====================================== -->
        <!-- CONTENIDO CON DESPLAZAMIENTO          -->
        <!-- ====================================== -->

        <div class="modal-body">
          <div class="form-grid">

            <!-- Nombre del proveedor -->
            <div class="form-group full-width">
              <label for="nombre">
                Nombre del proveedor *
              </label>

              <input
                id="nombre"
                v-model.trim="formulario.nombre"
                type="text"
                placeholder="Nombre o razón social"
                maxlength="150"
                required
              />
            </div>

            <!-- NIT -->
            <div class="form-group">
              <label for="nit">
                NIT *
              </label>

              <input
                id="nit"
                v-model.trim="formulario.nit"
                type="text"
                placeholder="Número de identificación tributaria"
                required
              />
            </div>

            <!-- Teléfono -->
            <div class="form-group">
              <label for="telefono">
                Teléfono
              </label>

              <input
                id="telefono"
                v-model.trim="formulario.telefono"
                type="tel"
                placeholder="Número de teléfono"
              />
            </div>

            <!-- Correo electrónico -->
            <div class="form-group full-width">
              <label for="correo">
                Correo electrónico
              </label>

              <input
                id="correo"
                v-model.trim="formulario.correo"
                type="email"
                placeholder="correo@empresa.com"
              />
            </div>

            <!-- Dirección -->
            <div class="form-group full-width">
              <label for="direccion">
                Dirección
              </label>

              <textarea
                id="direccion"
                v-model.trim="formulario.direccion"
                rows="3"
                placeholder="Dirección del proveedor"
              ></textarea>
            </div>


                <!-- Estado del proveedor -->
                <div class="form-group full-width">
                  <label for="estado">
                    Estado del proveedor
                  </label>

                  <!-- Mostrar el estado real sin permitir modificarlo aquí -->
                  <select
                    id="estado"
                    v-model="formulario.activo"
                    disabled
                  >
                    <option :value="true">Activo</option>
                    <option :value="false">Inactivo</option>
                  </select>
                </div>

          </div>
        </div>

        <!-- ====================================== -->
        <!-- BOTONES INFERIORES FIJOS              -->
        <!-- ====================================== -->

        <footer class="modal-footer">

          <!-- Cancelar -->
          <button
            type="button"
            class="btn-cancel"
            @click="emit('cerrar')"
          >
            Cancelar
          </button>

          <!-- Registrar o guardar cambios -->
          <button
            type="submit"
            class="btn-save"
          >
            {{
              proveedor
                ? 'Guardar cambios'
                : 'Registrar proveedor'
            }}
          </button>

        </footer>

      </form>

    </section>
  </div>
</template>

<style scoped>

/* ========================================= */
/* FONDO DE LA VENTANA MODAL                 */
/* ========================================= */

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

/* ========================================= */
/* VENTANA PRINCIPAL                         */
/* ========================================= */

.modal-card {
  display: flex;
  flex-direction: column;

  width: 100%;
  max-width: 620px;
  max-height: min(90vh, 800px);

  box-sizing: border-box;
  overflow: hidden;

  background: #ffffff;
  border: 1px solid #e9def4;
  border-radius: 22px;

  box-shadow: 0 24px 70px rgba(45, 25, 75, 0.2);

  font-family: Arial, sans-serif;
}

/* ========================================= */
/* ENCABEZADO FIJO                           */
/* ========================================= */

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 20px;

  flex-shrink: 0;

  padding: 30px 32px 24px;

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
  color: #9681aa;
  font-size: 14px;
  margin: 0;
}

/* Botón para cerrar */
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

/* ========================================= */
/* FORMULARIO                                */
/* ========================================= */

.modal-form {
  display: flex;
  flex-direction: column;

  flex: 1;
  min-height: 0;
}

/* ========================================= */
/* CUERPO CON DESPLAZAMIENTO                 */
/* ========================================= */

.modal-body {
  flex: 1;
  min-height: 0;

  overflow-y: auto;
  overscroll-behavior: contain;

  padding: 26px 32px;
}

/* Barra de desplazamiento */
.modal-body::-webkit-scrollbar {
  width: 7px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f8f5fc;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #c8b1df;
  border-radius: 10px;
}

/* ========================================= */
/* DISTRIBUCIÓN DE CAMPOS                    */
/* ========================================= */

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

/* ========================================= */
/* CAMPOS DE ENTRADA                         */
/* ========================================= */

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  box-sizing: border-box;

  border: 1px solid #e5d9f0;
  border-radius: 11px;

  padding: 13px 15px;

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
.form-group textarea:focus,
.form-group select:focus {
  border-color: #946bbb;

  box-shadow:
    0 0 0 3px rgba(148, 107, 187, 0.12);
}

.form-group textarea {
  resize: vertical;
}

/* ========================================= */
/* BOTONES INFERIORES FIJOS                  */
/* ========================================= */

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;

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

  transition: background 0.2s;
}

/* Cancelar */
.btn-cancel {
  border: 1px solid #e5d9f0;
  background: #ffffff;
  color: #7950ae;
}

.btn-cancel:hover {
  background: #f8f5fc;
}

/* Guardar */
.btn-save {
  border: none;
  background: #7950ae;
  color: white;
}

.btn-save:hover {
  background: #633e96;
}

/* ========================================= */
/* PANTALLAS PEQUEÑAS                        */
/* ========================================= */

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
