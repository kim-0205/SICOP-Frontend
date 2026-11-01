
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

interface UsuarioSesion {
  usuarioId: number
  nombre: string
  correo: string
  rolId: number
}

const usuarioSesion = computed<UsuarioSesion | null>(() => {
  const datos = sessionStorage.getItem('sicop_usuario')

  if (!datos) return null

  try {
    return JSON.parse(datos) as UsuarioSesion
  } catch {
    return null
  }
})

const inicialUsuario = computed(() =>
  usuarioSesion.value?.nombre?.charAt(0).toUpperCase() || 'S'
)

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

const fechaActual = computed(() =>
  new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()),
)

async function cerrarSesion() {
  sessionStorage.removeItem('sicop_token')

  sessionStorage.removeItem('sicop_usuario')

  await router.replace('/login')
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <div class="topbar-icon">✦</div>

      <div>
        <span class="topbar-label">
          SISTEMA DE CUENTAS POR PAGAR
        </span>

        <h2>{{ titulo }}</h2>
      </div>
    </div>

    <div class="topbar-right">
      <span class="topbar-date">
        {{ fechaActual }}
      </span>

      <div class="topbar-divider"></div>

      <div class="topbar-user">
        <div class="user-avatar">{{ inicialUsuario }}</div>

        <div class="user-info">
          <strong>{{ usuarioSesion?.nombre || 'SICOP' }}</strong>
          <span>{{ usuarioSesion?.correo || '' }}</span>
        </div>
      </div>

      <button
        type="button"
        class="logout-button"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        @click="cerrarSesion"
      >
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

.logout-button:hover {
  background: #7551a7;
  color: #ffffff;
  transform: translateY(-1px);
}

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
