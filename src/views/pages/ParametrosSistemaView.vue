
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiGet, apiPost, apiPut } from '@/services/api'

// Datos que devuelve el backend.
interface ParametroSistema {
  parametroSistemaId: number
  clave: string
  valor: string
  descripcion: string | null
}

// Datos que enviamos al crear o editar.
interface ParametroFormulario {
  clave: string
  valor: string
  descripcion: string | null
}

const parametros = ref<ParametroSistema[]>([])
const busqueda = ref('')
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')
const mensaje = ref('')

const mostrarFormulario = ref(false)
const editandoId = ref<number | null>(null)

const formulario = ref({
  clave: '',
  valor: '',
  descripcion: '',
})

// Filtra los registros por clave, valor o descripción.
const parametrosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()

  return parametros.value.filter((p) =>
    [p.clave, p.valor, p.descripcion ?? '']
      .some((campo) => campo.toLowerCase().includes(texto))
  )
})

// Consulta los parámetros existentes en SQL Server.
async function cargarParametros() {
  cargando.value = true
  error.value = ''

  try {
    parametros.value = await apiGet<ParametroSistema[]>(
      '/api/ParametrosSistemas'
    )
  } catch {
    error.value = 'No fue posible cargar los parámetros del sistema.'
  } finally {
    cargando.value = false
  }
}

// Abre el formulario para crear un registro.
function nuevoParametro() {
  editandoId.value = null
  formulario.value = { clave: '', valor: '', descripcion: '' }
  error.value = ''
  mensaje.value = ''
  mostrarFormulario.value = true
}

// Abre el formulario con los datos existentes.
function editarParametro(parametro: ParametroSistema) {
  editandoId.value = parametro.parametroSistemaId

  formulario.value = {
    clave: parametro.clave,
    valor: parametro.valor,
    descripcion: parametro.descripcion ?? '',
  }

  error.value = ''
  mensaje.value = ''
  mostrarFormulario.value = true
}

function cerrarFormulario() {
  if (guardando.value) return
  mostrarFormulario.value = false
}

// Registra o actualiza un parámetro.
async function guardarParametro() {
  error.value = ''
  mensaje.value = ''

  const clave = formulario.value.clave.trim()
  const valor = formulario.value.valor.trim()

  if (!clave || !valor) {
    error.value = 'La clave y el valor son obligatorios.'
    return
  }

  const datos: ParametroFormulario = {
    clave,
    valor,
    descripcion: formulario.value.descripcion.trim() || null,
  }

  guardando.value = true

  try {
    if (editandoId.value === null) {
      await apiPost<ParametroSistema>(
        '/api/ParametrosSistemas',
        datos
      )
      mensaje.value = 'Parámetro registrado correctamente.'
    } else {
      await apiPut<void>(
        `/api/ParametrosSistemas/${editandoId.value}`,
        datos
      )
      mensaje.value = 'Parámetro actualizado correctamente.'
    }

    mostrarFormulario.value = false
    await cargarParametros()
  } catch (e) {
    error.value =
      e instanceof Error
        ? `No fue posible guardar el parámetro. ${e.message}`
        : 'No fue posible guardar el parámetro.'
  } finally {
    guardando.value = false
  }
}

onMounted(cargarParametros)
</script>

<template>
  <main class="parametros-page">
    <div class="page-header">
      <div>
        <h1>Parámetros del Sistema</h1>
        <p>Administra las configuraciones generales de SICOP.</p>
      </div>

      <button class="btn-primary" @click="nuevoParametro">
        + Nuevo parámetro
      </button>
    </div>

    <div class="summary-card">
      <span>Parámetros registrados</span>
      <strong>{{ parametros.length }}</strong>
    </div>

    <p v-if="mensaje" class="alert success">{{ mensaje }}</p>
    <p v-if="error" class="alert error" role="alert">{{ error }}</p>

    <section class="table-card">
      <div class="table-header">
        <h2>Listado de parámetros</h2>

        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar parámetro..."
          aria-label="Buscar parámetros"
        />
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Clave</th>
              <th>Valor</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="cargando">
              <td colspan="4" class="empty">
                Cargando parámetros...
              </td>
            </tr>

            <tr v-else-if="parametrosFiltrados.length === 0">
              <td colspan="4" class="empty">
                No hay parámetros para mostrar.
              </td>
            </tr>

            <tr
              v-for="parametro in cargando ? [] : parametrosFiltrados"
              :key="parametro.parametroSistemaId"
            >
              <td class="clave">{{ parametro.clave }}</td>
              <td>{{ parametro.valor }}</td>
              <td>{{ parametro.descripcion || 'Sin descripción' }}</td>
              <td>
                <button
                  class="btn-edit"
                  @click="editarParametro(parametro)"
                >
                  Editar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Formulario para crear o editar -->
    <div
      v-if="mostrarFormulario"
      class="modal-overlay"
      @click.self="cerrarFormulario"
    >
      <section
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
      >
        <h2 id="modal-titulo">
          {{ editandoId === null ? 'Nuevo parámetro' : 'Editar parámetro' }}
        </h2>

        <form @submit.prevent="guardarParametro">
          <label for="clave">Clave *</label>
          <input
            id="clave"
            v-model="formulario.clave"
            required
            maxlength="100"
            placeholder="Ej. MONEDA"
          />

          <label for="valor">Valor *</label>
          <input
            id="valor"
            v-model="formulario.valor"
            required
            placeholder="Ej. GTQ"
          />

          <label for="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            v-model="formulario.descripcion"
            rows="3"
            placeholder="Describe para qué se utiliza este parámetro"
          ></textarea>

          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              :disabled="guardando"
              @click="cerrarFormulario"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="btn-primary"
              :disabled="guardando"
            >
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.parametros-page {
  padding: 30px;
  min-height: 100%;
  background: #f8f5fc;
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #352057;
}

.page-header,
.table-header,
.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.page-header {
  margin-bottom: 24px;
}

h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

p {
  margin: 0;
  color: #87799a;
}

.btn-primary {
  background: #7551a7;
  color: white;
  border: 0;
  padding: 12px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:hover {
  background: #493078;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.summary-card,
.table-card {
  background: white;
  border: 1px solid #ece4f4;
  border-radius: 16px;
  box-shadow: 0 5px 18px rgba(73, 48, 120, 0.05);
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  max-width: 250px;
  margin-bottom: 24px;
}

.summary-card span {
  font-size: 13px;
  color: #87799a;
}

.summary-card strong {
  font-size: 30px;
}

.table-card {
  overflow: hidden;
}

.table-header {
  padding: 20px;
}

.table-header h2 {
  margin: 0;
  font-size: 18px;
}

input,
textarea {
  padding: 11px 13px;
  border: 1px solid #e1d5ee;
  border-radius: 9px;
  font: inherit;
  color: #352057;
  box-sizing: border-box;
}

input:focus,
textarea:focus {
  outline: 2px solid #b69bd5;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  background: #f2ebf9;
  color: #493078;
  font-size: 13px;
}

th,
td {
  padding: 15px 20px;
  border-bottom: 1px solid #eee8f5;
}

td {
  color: #62566f;
  font-size: 14px;
}

.clave {
  font-weight: 700;
  color: #493078;
}

.empty {
  text-align: center;
  padding: 30px;
}

.btn-edit {
  background: #eee5f8;
  color: #634091;
  border: 0;
  padding: 9px 15px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-edit:hover {
  background: #e1d1f3;
}

.alert {
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.success {
  background: #e8f7ee;
  color: #246b42;
}

.error {
  background: #fdeaea;
  color: #a22d2d;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(25, 15, 43, 0.55);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 18px;
  padding: 28px;
  box-sizing: border-box;
}

.modal h2 {
  margin: 0 0 22px;
}

.modal form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal input,
.modal textarea {
  width: 100%;
  margin-bottom: 8px;
}

.modal-actions {
  margin-top: 18px;
}

.btn-secondary {
  background: #eee8f5;
  color: #493078;
  border: 0;
  padding: 12px 18px;
  border-radius: 10px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .parametros-page {
    padding: 16px;
  }

  .page-header,
  .table-header {
    align-items: stretch;
    flex-direction: column;
  }

  .summary-card {
    max-width: none;
  }
}
</style>
