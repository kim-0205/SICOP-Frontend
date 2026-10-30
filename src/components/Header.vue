
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Obtenemos la ruta actual del sistema.
const route = useRoute()

// Identificamos la sección en la que estamos.
const titulo = computed(() => {
  const titulos: Record<string, string> = {
    dashboard: 'Panel principal',
    proveedores: 'Proveedores',
    facturas: 'Facturas de compra',
    pagos: 'Pagos',
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

      <div class="topbar-user">
        <div class="user-avatar">S</div>

        <div class="user-info">
          <strong>SICOP</strong>
          <span>Sesión de demostración</span>
        </div>
      </div>
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

@media (max-width: 768px) {
  .topbar {
    padding: 16px 20px;
    flex-wrap: wrap;
  }

  .topbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .topbar-date {
    font-size: 11px;
  }

  h2 {
    font-size: 17px;
  }
}
</style>
