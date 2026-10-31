
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Obtenemos la ruta actual y el router del sistema.
const route = useRoute()
const router = useRouter()

// Estructura de los datos del usuario autenticado.
interface UsuarioSesion {
  usuarioId: number
  nombre: string
  correo: string
  rolId: number
}

// Recupera los datos guardados durante el login.
const usuarioSesion = computed<UsuarioSesion | null>(() => {
  const datos = sessionStorage.getItem('sicop_usuario')

  if (!datos) return null

  try {
    return JSON.parse(datos) as UsuarioSesion
  } catch {
    return null
  }
})

// Obtiene la inicial del usuario.
const inicialUsuario = computed(() =>
  usuarioSesion.value?.nombre?.charAt(0).toUpperCase() || 'S'
)

// Identificamos la sección en la que estamos.
const titulo = computed(() => {
  const titulos: Record<string, string> = {
    dashboard: 'Panel principal',
    proveedores: 'Proveedores',
    facturas: 'Facturas de compra',
    pagos: 'Pagos',
    'estados-cuenta': 'Estados de Cuenta',
    usuarios: 'Usuarios',
  }

  return titulos[String(route.name)] ?? 'SICOP'
})

// Fecha actual del sistema.
const fechaActual = computed(() =>
  new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()),
)

// Cierra la sesión del usuario autenticado.
async function cerrarSesion() {
  // Elimina el token JWT.
  sessionStorage.removeItem('sicop_token')

  // Elimina los datos del usuario.
  sessionStorage.removeItem('sicop_usuario')

  // Regresa a la pantalla de inicio de sesión.
  await router.replace('/login')
}
</script>

<template>
  <header class="topbar">

    <!-- Información de la sección -->
    <div class="topbar-left">
      <div class="topbar-icon">✦</div>

      <div>
        <span class="topbar-label">
          SISTEMA DE CUENTAS POR PAGAR
        </span>

        <h2>{{ titulo }}</h2>
      </div>
    </div>

    <!-- Información de la sesión -->
    <div class="topbar-right">
      <span class="topbar-date">
        {{ fechaActual }}
      </span>

      <div class="topbar-divider"></div>

      <!-- Usuario autenticado -->
      <div class="topbar-user">
        <div class="user-avatar">{{ inicialUsuario }}</div>

        <div class="user-info">
          <strong>{{ usuarioSesion?.nombre || 'SICOP' }}</strong>
          <span>{{ usuarioSesion?.correo || '' }}</span>
        </div>
      </div>

      <!-- Botón de cerrar sesión -->
      <button
        type="button"
        class="logout-button"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        @click="cerrarSesion"
      >
        <!-- Símbolo de encendido -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2v10" />
          <path d="M18.36 6.64a9 9 0 1 1-12.72 0" />
        </svg>
      </button>
    </div>

  </header>
</template>

<style scoped>
.topbar {
  min-height: 94px;
  padding: 18px 40px;
  background: #ffffff;
  border-bottom: 1px solid #ebe3f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.topbar-left,
.topbar-right,
.topbar-user {
  display: flex;
  align-items: center;
}

.topbar-left {
  gap: 15px;
}

.topbar-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #f0e8f8;
  color: #7950ae;
  display: grid;
  place-items: center;
  font-size: 24px;
}

.topbar-label {
  font-size: 10px;
  letter-spacing: 1.5px;
  color: #9a82b4;
  font-weight: 700;
}

h2 {
  margin: 5px 0 0;
  font-size: 20px;
  color: #352057;
  font-weight: 700;
}

.topbar-right {
  gap: 25px;
}

.topbar-date {
  color: #8b79a4;
  font-size: 13px;
  text-transform: capitalize;
}

.topbar-divider {
  width: 1px;
  height: 35px;
  background: #e9def2;
}

.topbar-user {
  gap: 12px;
}

.user-avatar {
  width: 43px;
  height: 43px;
  border-radius: 50%;
  background: #e9d9f5;
  color: #593583;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-info strong {
  font-size: 13px;
  color: #352057;
}

.user-info span {
  font-size: 11px;
  color: #9a87ae;
}

/* Botón morado para cerrar sesión */
.logout-button {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid #e5d7f3;
  border-radius: 12px;
  background: #f0e8f8;
  color: #7551a7;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}

/* Efecto al pasar el cursor */
.logout-button:hover {
  background: #7551a7;
  color: #ffffff;
  transform: translateY(-1px);
}

/* Accesibilidad mediante teclado */
.logout-button:focus-visible {
  outline: 3px solid #b79ad9;
  outline-offset: 3px;
}

@media (max-width: 768px) {
  .topbar {
    padding: 16px 20px;
    flex-wrap: wrap;
  }

  .topbar-right {
    width: 100%;
    justify-content: space-between;
    gap: 12px;
  }

  .topbar-date {
    font-size: 11px;
  }

  .user-info span {
    overflow-wrap: anywhere;
  }

  h2 {
    font-size: 17px;
  }
}
</style>
