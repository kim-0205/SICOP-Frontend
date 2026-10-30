
<script setup lang="ts">
import { reactive, watch } from 'vue'

// =============================================
// TIPOS DE DATOS
// =============================================

// Los identificadores de los roles vendrán del backend.
interface RolOpcion {
  rolId: number
  nombre: string
}

interface UsuarioFormulario {
  usuarioId?: number
  nombre: string
  correo: string
  rolId: number
  activo: boolean
}

// =============================================
// PROPIEDADES DEL COMPONENTE
// =============================================

const props = defineProps<{
  visible: boolean
  usuario: UsuarioFormulario | null
  roles: RolOpcion[]
}>()

// =============================================
// EVENTOS
// =============================================

const emit = defineEmits<{
  cerrar: []
  guardar: [datos: UsuarioFormulario & {
    password?: string
  }]
}>()

// =============================================
// FORMULARIO
// =============================================

const formulario = reactive({
  usuarioId: undefined as number | undefined,
  nombre: '',
  correo: '',
  password: '',
  rolId: 0,
  activo: true
})

// Limpiar el formulario o cargar el usuario
// seleccionado cuando se abre el modal.
watch(
  () => [props.visible, props.usuario] as const,
  () => {
    if (!props.visible) return

    formulario.usuarioId = props.usuario?.usuarioId
    formulario.nombre = props.usuario?.nombre ?? ''
    formulario.correo = props.usuario?.correo ?? ''
    formulario.password = ''
    formulario.rolId = props.usuario?.rolId ?? 0
    formulario.activo = props.usuario?.activo ?? true
  },
  { immediate: true }
)

// =============================================
// GUARDAR USUARIO
// =============================================

function guardar() {
  const nombre = formulario.nombre.trim()
  const correo = formulario.correo.trim()

  if (!nombre || !correo) {
    alert('El nombre y el correo son obligatorios.')
    return
  }

  if (nombre.length > 150 || correo.length > 150) {
    alert('El nombre y el correo permiten máximo 150 caracteres.')
    return
  }

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!correoValido.test(correo)) {
    alert('Ingrese un correo electrónico válido.')
    return
  }

  if (!props.roles.some(rol => rol.rolId === formulario.rolId)) {
    alert('Seleccione un rol válido.')
    return
  }

  // La contraseña es obligatoria al crear.
  if (
    formulario.usuarioId === undefined &&
    !formulario.password.trim()
  ) {
    alert('La contraseña es obligatoria.')
    return
  }

  // El cambio de contraseña se implementará
  // con su propio endpoint del backend.
  // Por eso no permitimos cambiarla al editar.
  const datos: UsuarioFormulario & {
    password?: string
  } = {
    usuarioId: formulario.usuarioId,
    nombre,
    correo,
    rolId: formulario.rolId,
    activo: formulario.activo
  }

  if (formulario.usuarioId === undefined) {
    datos.password = formulario.password
  }

  emit('guardar', datos)
}

function cerrar() {
  emit('cerrar')
}
</script>

<template>
  <div v-if="visible" class="modal-overlay">
    <div
      class="modal-container"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-usuario"
    >
      <!-- Encabezado fijo -->
      <div class="modal-header">
        <div>
          <span class="modal-label">ADMINISTRACIÓN</span>
          <h2 id="titulo-usuario">
            {{ usuario ? 'Editar usuario' : 'Nuevo usuario' }}
          </h2>
          <p>Complete la información del usuario de SICOP.</p>
        </div>

        <button
          type="button"
          class="btn-close"
          aria-label="Cerrar formulario"
          @click="cerrar"
        >
          ×
        </button>
      </div>

      <!-- Contenido desplazable -->
      <form
        id="formulario-usuario"
        class="modal-body"
        @submit.prevent="guardar"
      >
        <div class="form-group">
          <label for="usuario-nombre">Nombre completo *</label>
          <input
            id="usuario-nombre"
            v-model="formulario.nombre"
            type="text"
            maxlength="150"
            placeholder="Ingrese el nombre completo"
            required
          />
        </div>

        <div class="form-group">
          <label for="usuario-correo">Correo electrónico *</label>
          <input
            id="usuario-correo"
            v-model="formulario.correo"
            type="email"
            maxlength="150"
            placeholder="ejemplo@correo.com"
            required
          />
        </div>

        <div v-if="!usuario" class="form-group">
          <label for="usuario-password">Contraseña *</label>
          <input
            id="usuario-password"
            v-model="formulario.password"
            type="password"
            autocomplete="new-password"
            placeholder="Ingrese una contraseña"
            required
          />
          <small>
            La contraseña será procesada de forma segura por el backend.
          </small>
        </div>

        <div v-else class="info-message">
          <span>ⓘ</span>
          <p>
            La contraseña no se modifica desde este formulario.
            Posteriormente implementaremos su cambio seguro.
          </p>
        </div>

        <div class="form-group">
          <label for="usuario-rol">Rol del usuario *</label>
          <select
            id="usuario-rol"
            v-model.number="formulario.rolId"
            required
          >
            <option :value="0" disabled>
              Seleccione un rol
            </option>

            <option
              v-for="rol in roles"
              :key="rol.rolId"
              :value="rol.rolId"
            >
              {{ rol.nombre }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Estado del usuario</label>

          <label class="checkbox-container">
            <input
              v-model="formulario.activo"
              type="checkbox"
            />
            <span>Usuario activo</span>
          </label>

          <small>
            Los usuarios inactivos no podrán iniciar sesión
            cuando integremos la autenticación real.
          </small>
        </div>
      </form>

      <!-- Pie fijo -->
      <div class="modal-footer">
        <button
          type="button"
          class="btn-cancel"
          @click="cerrar"
        >
          Cancelar
        </button>

        <button
          type="submit"
          form="formulario-usuario"
          class="btn-save"
        >
          {{ usuario ? 'Guardar cambios' : 'Registrar usuario' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: rgba(31, 19, 51, 0.58);
  box-sizing: border-box;
}

.modal-container {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 70px rgba(31, 19, 51, 0.25);
  font-family: 'Segoe UI', Arial, sans-serif;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 28px 30px 22px;
  border-bottom: 1px solid #eee6f5;
}

.modal-label {
  color: #9069b6;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.6px;
}

.modal-header h2 {
  margin: 9px 0;
  color: #352057;
  font-size: 25px;
}

.modal-header p {
  margin: 0;
  color: #9784aa;
  font-size: 13px;
}

.btn-close {
  align-self: flex-start;
  border: none;
  background: transparent;
  color: #907aa6;
  font-size: 30px;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 25px 30px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 22px;
}

.form-group > label:first-child {
  color: #493078;
  font-size: 13px;
  font-weight: 700;
}

.form-group input:not([type='checkbox']),
.form-group select {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid #e4d9f0;
  border-radius: 11px;
  outline: none;
  background: #fcfaff;
  color: #352057;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #7950ae;
  box-shadow: 0 0 0 3px rgba(121, 80, 174, 0.1);
}

.form-group small {
  color: #9784aa;
  font-size: 12px;
  line-height: 1.5;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #57436f;
  font-size: 14px;
  cursor: pointer;
}

.checkbox-container input {
  width: 17px;
  height: 17px;
  accent-color: #7950ae;
}

.info-message {
  display: flex;
  gap: 12px;
  padding: 14px;
  margin-bottom: 22px;
  border-radius: 11px;
  background: #f5effb;
  color: #7551a7;
}

.info-message p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 30px;
  border-top: 1px solid #eee6f5;
  background: white;
}

.btn-cancel,
.btn-save {
  padding: 13px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel {
  border: 1px solid #e5d9f0;
  background: #fff;
  color: #7950ae;
}

.btn-save {
  border: none;
  background: #7950ae;
  color: white;
}

.btn-save:hover {
  background: #633e96;
}

@media (max-width: 480px) {
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
  }
}
</style>
