
import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/auth/LoginView.vue'
import DashboardView from '../views/pages/DashboardView.vue'
import ProveedoresView from '../views/pages/ProveedoresView.vue'
import FacturasView from '../views/pages/FacturasView.vue'
import PagosView from '../views/pages/PagosView.vue'
import ParametrosSistemaView from '../views/pages/ParametrosSistemaView.vue'
import UsuariosView from '../views/pages/UsuariosView.vue'
import PruebaConexionView from '../views/pages/PruebaConexionView.vue'
import EstadosCuentaView from '../views/pages/EstadosCuentaView.vue'

import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiereAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'proveedores',
          name: 'proveedores',
          component: ProveedoresView,
        },
        {
          path: 'facturas',
          name: 'facturas',
          component: FacturasView,
        },
        {
          path: 'pagos',
          name: 'pagos',
          component: PagosView,
        },
        {
          path: 'estados-cuenta',
          name: 'estados-cuenta',
          component: EstadosCuentaView,
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: UsuariosView,
          meta: { requiereAdmin: true },
        },
        {
          path: 'parametros-sistema',
          name: 'parametros-sistema',
          component: ParametrosSistemaView,
          meta: { requiereAdmin: true },
        },
      ],
    },
    {
      path: '/prueba-conexion',
      name: 'prueba-conexion',
      component: PruebaConexionView,
    },
  ],
})

router.beforeEach((to) => {
  const token = sessionStorage.getItem('sicop_token')

  const requiereAuth = to.matched.some(
    (ruta) => ruta.meta.requiereAuth
  )

  if (requiereAuth && !token) {
    return { name: 'login' }
  }

  if (to.name === 'login' && token) {
    return { name: 'dashboard' }
  }

  const requiereAdmin = to.matched.some(
    (ruta) => ruta.meta.requiereAdmin
  )

  if (requiereAdmin) {
    const datosSesion = sessionStorage.getItem('sicop_usuario')

    let rolId: number | null = null

    if (datosSesion) {
      try {
        const usuario = JSON.parse(datosSesion) as {
          rolId?: number | string
        }

        rolId = Number(usuario.rolId)
      } catch {
        rolId = null
      }
    }

    if (rolId !== 1) {
      return { name: 'dashboard' }
    }
  }

  return true
})

export default router
