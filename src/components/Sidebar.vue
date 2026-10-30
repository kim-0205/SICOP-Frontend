
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

// SICOP - Menú lateral de navegación.
// Módulos habilitados:
// Dashboard, Proveedores, Facturas de compra,
// Pagos y Usuarios.

// Permite navegar hacia el Login.
const router = useRouter()

// Recupera los datos del usuario autenticado.
const usuarioSesion = computed(() => {
  const datos = sessionStorage.getItem('sicop_usuario')

  if (!datos) return null

  try {
    return JSON.parse(datos) as {
      nombre: string
      correo: string
    }
  } catch {
    return null
  }
})

// Obtiene la inicial del nombre.
const inicialUsuario = computed(() =>
  usuarioSesion.value?.nombre?.charAt(0).toUpperCase() || 'S'
)

// Cierra la sesión del usuario autenticado.
async function cerrarSesion() {
  // Elimina el token JWT almacenado.
  sessionStorage.removeItem('sicop_token')

  // Elimina la información del usuario autenticado.
  sessionStorage.removeItem('sicop_usuario')

  // Redirige al inicio de sesión.
  await router.replace('/login')
}
</script>

<template>
  <aside class="sidebar">

    <!-- Identidad del sistema -->
    <div class="sidebar-brand">
      <div class="brand-icon">◆</div>

      <div>
        <h2>SICOP</h2>
        <span>Cuentas por Pagar</span>
      </div>
    </div>

    <!-- Menú principal -->
    <nav class="sidebar-nav" aria-label="Menú principal">

      <p class="menu-label">MENÚ PRINCIPAL</p>

      <RouterLink to="/dashboard" class="nav-item">
        <span class="nav-icon">▦</span>
        <span>Panel principal</span>
      </RouterLink>

      <!-- Módulos de administración -->
      <p class="menu-label section-label">ADMINISTRACIÓN</p>

      <!-- NUEVO: Proveedores habilitado -->
      <RouterLink to="/proveedores" class="nav-item">
        <span class="nav-icon">♙</span>
        <span>Proveedores</span>
      </RouterLink>

      <!-- NUEVO: Facturas de compra habilitado -->
      <RouterLink to="/facturas" class="nav-item">
        <span class="nav-icon">▤</span>
        <span>Facturas de compra</span>
      </RouterLink>

      <!-- NUEVO: Pagos habilitado -->
      <RouterLink to="/pagos" class="nav-item">
        <span class="nav-icon">◈</span>
        <span>Pagos</span>
      </RouterLink>

      <!-- Módulo de administración de usuarios habilitado -->
<RouterLink to="/usuarios" class="nav-item">
  <span class="nav-icon">♧</span>
  <span>Usuarios</span>
</RouterLink>

    </nav>

    <!-- Parte inferior -->
    <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">{{ inicialUsuario }}</div>

            <div>
              <strong>{{ usuarioSesion?.nombre || 'SICOP' }}</strong>
              <small>{{ usuarioSesion?.correo || '' }}</small>
            </div>
          </div>

          <!-- Cierra la sesión real del usuario. -->
          <button
            type="button"
            class="logout-button"
            @click="cerrarSesion"
            >
              <span>↪</span>
              <span>Cerrar sesión</span>
            </button>
        </div>

  </aside>
</template>

<style scoped>
/* Contenedor principal del menú */
.sidebar {
  width: 260px;
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(180deg, #493078, #39245e);
  color: white;
  display: flex;
  flex-direction: column;
  padding: 28px 18px;
  box-sizing: border-box;
  font-family: 'Segoe UI', Arial, sans-serif;
}

/* Logotipo */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.brand-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  font-size: 23px;
}

.sidebar-brand h2 {
  margin: 0;
  font-size: 23px;
  letter-spacing: 1px;
}

.sidebar-brand span {
  color: #d9c8ef;
  font-size: 11px;
}

/* Navegación */
.sidebar-nav {
  flex: 1;
  padding-top: 26px;
}

.menu-label {
  color: #bda9d9;
  font-size: 10px;
  letter-spacing: 1.5px;
  font-weight: 700;
  padding-left: 14px;
  margin-bottom: 16px;
}

.section-label {
  margin-top: 34px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  margin-bottom: 6px;
  border-radius: 11px;
  color: #e6d9f6;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}

.nav-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

/* Elemento seleccionado */
.nav-item.router-link-active {
  background: #7551a7;
  color: white;
  font-weight: 600;
}

/* Efecto al pasar el cursor */
a.nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

/* Opciones todavía no disponibles */
.nav-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Información inferior */
.sidebar-footer {
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  margin-bottom: 15px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #b79ad9;
  color: #39245e;
  font-weight: 700;
}

.user-info strong,
.user-info small {
  display: block;
}

.user-info strong {
  font-size: 13px;
}

.user-info small {
  margin-top: 4px;
  font-size: 11px;
  color: #cbb8e6;
}

/* Regresar al Login */
.logout-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  border-radius: 10px;
  color: #e6d9f6;
  text-decoration: none;
  font-size: 13px;
  background: transparent;
  border: none;
  width: 100%;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* Ajuste para pantallas pequeñas.
   Posteriormente implementaremos el menú móvil. */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    min-height: auto;
  }
}
</style>
