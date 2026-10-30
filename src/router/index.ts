import { createRouter, createWebHistory } from 'vue-router'

// =============================================
// IMPORTACIÓN DE LAS VISTAS DEL SISTEMA SICOP
// =============================================

// Pantalla de inicio de sesión.
import LoginView from '../views/auth/LoginView.vue'

// Panel principal del sistema.
import DashboardView from '../views/pages/DashboardView.vue'

// Módulo de gestión de proveedores.
import ProveedoresView from '../views/pages/ProveedoresView.vue'

// Módulo de facturas de compra.
import FacturasView from '../views/pages/FacturasView.vue'

// Módulo de pagos parciales y completos.
// NUEVO: agregamos únicamente esta importación.
import PagosView from '../views/pages/PagosView.vue'

// Módulo de administración de usuarios.
// Permite registrar, editar y administrar usuarios.
import UsuariosView from '../views/pages/UsuariosView.vue'

// Pantalla para probar la conexión con el backend.
import PruebaConexionView from '../views/pages/PruebaConexionView.vue'

// =============================================
// IMPORTACIÓN DEL DISEÑO ADMINISTRATIVO
// =============================================

// Contiene el Sidebar y Header del sistema.
import MainLayout from '../layouts/MainLayout.vue'

// =============================================
// CONFIGURACIÓN DE LAS RUTAS
// =============================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      // Redirigir la página inicial al Login.
      path: '/',
      redirect: '/login',
    },
    {
      // Pantalla de inicio de sesión.
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      // =============================================
      // RUTAS DEL PANEL ADMINISTRATIVO
      // =============================================
      // Estas rutas comparten Sidebar y Header.

      path: '/',
      component: MainLayout,

      children: [
        {
          // Panel principal.
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          // Gestión de proveedores.
          path: 'proveedores',
          name: 'proveedores',
          component: ProveedoresView,
        },
        {
          // Gestión de facturas de compra.
          path: 'facturas',
          name: 'facturas',
          component: FacturasView,
        },
        {
          // NUEVO: Gestión de pagos.
          // Permite consultar y registrar pagos.
          path: 'pagos',
          name: 'pagos',
          component: PagosView,
        },

        {
  // Módulo de administración de usuarios.
  // Permite gestionar usuarios y sus roles.
  path: 'usuarios',
  name: 'usuarios',
  component: UsuariosView,
},
      ],
    },
    {
      // =============================================
      // PRUEBA DE CONEXIÓN CON EL BACKEND
      // =============================================

      path: '/prueba-conexion',
      name: 'prueba-conexion',
      component: PruebaConexionView,
    },
  ],
})

// Exportamos el router para utilizarlo en SICOP.
export default router
