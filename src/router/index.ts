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
import PagosView from '../views/pages/PagosView.vue'

// Módulo de Parámetros del Sistema.
import ParametrosSistemaView from '../views/pages/ParametrosSistemaView.vue'

// Módulo de administración de usuarios.
// Permite registrar, editar y administrar usuarios.
import UsuariosView from '../views/pages/UsuariosView.vue'

// Pantalla para probar la conexión con el backend.
import PruebaConexionView from '../views/pages/PruebaConexionView.vue'

// Módulo de Estados de Cuenta por proveedor.
import EstadosCuentaView from '../views/pages/EstadosCuentaView.vue'

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
        // Todas las vistas administrativas requieren autenticación.
        meta: { requiereAuth: true },
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
          // Consulta de estados de cuenta por proveedor.
          path: 'estados-cuenta',
          name: 'estados-cuenta',
          component: EstadosCuentaView,
        },
        {
          // Módulo exclusivo del Administrador General.
          path: 'usuarios',
          name: 'usuarios',
          component: UsuariosView,

          // Restringe el acceso a Usuarios al Administrador General.
          meta: { requiereAdmin: true },
        },

        // Parámetros del Sistema.
        // También es exclusivo del Administrador General.
        {
          path: 'parametros-sistema',
          name: 'parametros-sistema',
          component: ParametrosSistemaView,
          meta: { requiereAdmin: true },
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

// =============================================
// PROTECCIÓN DE RUTAS MEDIANTE AUTENTICACIÓN
// =============================================

router.beforeEach((to) => {

  // Obtiene el token JWT guardado al iniciar sesión.
  const token = sessionStorage.getItem('sicop_token')

  // Verifica si la ruta requiere autenticación.
  const requiereAuth = to.matched.some(
    (ruta) => ruta.meta.requiereAuth
  )

  // Si no existe token, redirige al login.
  if (requiereAuth && !token) {
    return { name: 'login' }
  }

  // Si ya inició sesión, evita volver al login.
  if (to.name === 'login' && token) {
    return { name: 'dashboard' }
  }

  // =============================================
  // PROTEGER RUTAS EXCLUSIVAS DEL ADMINISTRADOR
  // =============================================

  // Verifica si la ruta requiere el rol Administrador General.
  const requiereAdmin = to.matched.some(
    (ruta) => ruta.meta.requiereAdmin
  )

  if (requiereAdmin) {
    // Recupera la información del usuario autenticado.
    const datosSesion = sessionStorage.getItem('sicop_usuario')

    let rolId: number | null = null

    if (datosSesion) {
      try {
        const usuario = JSON.parse(datosSesion) as {
          rolId?: number | string
        }

        // RolId 1 corresponde al Administrador General.
        rolId = Number(usuario.rolId)
      } catch {
        rolId = null
      }
    }

    // Bloquea el acceso si no es Administrador General.
    if (rolId !== 1) {
      return { name: 'dashboard' }
    }
  }
  // Permite continuar hacia la ruta solicitada.
  return true
})

// Exportamos el router para utilizarlo en SICOP.
export default router
