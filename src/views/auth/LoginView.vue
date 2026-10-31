

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '@/services/api'
import logoSicop from '@/assets/logo-sicop.png'

// Permite navegar después de iniciar sesión.
const router = useRouter()

// Datos que ingresará el usuario.
const usuario = ref('')
const contrasena = ref('')
const mostrarContrasena = ref(false)

// Controla el estado del formulario.
const cargando = ref(false)
const error = ref('')

// Estructura que devuelve nuestro backend .NET.
interface LoginRespuestaDto {
  token: string
  expiracion: string
  usuarioId: number
  nombre: string
  correo: string
  rolId: number
}

// Autenticación real mediante JWT.
async function iniciarSesion() {
  error.value = ''
  cargando.value = true

  try {
    // Envía las credenciales al backend.
    const respuesta = await apiPost<LoginRespuestaDto>(
      '/api/Auth/login',
      {
        correo: usuario.value.trim(),
        password: contrasena.value,
      }
    )

    // Guarda el token durante la sesión del navegador.
    sessionStorage.setItem('sicop_token', respuesta.token)

    // Guarda la información básica del usuario.
    sessionStorage.setItem(
      'sicop_usuario',
      JSON.stringify({
        usuarioId: respuesta.usuarioId,
        nombre: respuesta.nombre,
        correo: respuesta.correo,
        rolId: respuesta.rolId,
      })
    )

    // Redirige al panel principal.
    await router.push('/dashboard')

  } catch (e) {
    // Evita conservar una sesión anterior inválida.
    sessionStorage.removeItem('sicop_token')
    sessionStorage.removeItem('sicop_usuario')

    error.value =
      e instanceof TypeError
        ? 'No se pudo conectar con el servidor.'
        : 'No fue posible iniciar sesión. Verifica tus credenciales.'
  } finally {
    cargando.value = false
  }
}
</script>


<template>
  <main class="login-page">
    <div class="login-container">

      <!-- Panel izquierdo: presentación del sistema -->
      <section class="login-brand">
       <!-- Logo oficial del sistema SICOP -->
<div class="brand-logo">
  <div class="logo-icon">
    <img
      :src="logoSicop"
      alt="Logo de SICOP"
      class="logo-sicop"
    />
  </div>

  <span>SICOP</span>
</div>

        <div class="brand-content">
          <span class="brand-label">SISTEMA ADMINISTRATIVO</span>

          <h1>
            Gestión financiera
            <span>inteligente.</span>
          </h1>

          <p>
            Administra tus proveedores, facturas y pagos
            desde una plataforma moderna, segura y eficiente.
          </p>

          <div class="brand-features">
            <div>✓ Control de cuentas por pagar</div>
            <div>✓ Seguimiento de facturas</div>
            <div>✓ Administración de pagos</div>
          </div>
        </div>

        <p class="brand-footer">
          SICOP · Sistema de Cuentas por Pagar
        </p>
      </section>

      <!-- Panel derecho: formulario de acceso -->
      <section class="login-form-panel">
        <div class="form-wrapper">

          <div class="welcome-icon">✦</div>

          <h2>¡Bienvenido!</h2>

          <p class="form-subtitle">
            Ingresa tus credenciales para acceder al sistema.
          </p>

          <form @submit.prevent="iniciarSesion">

            <!-- Campo de usuario -->
            <div class="form-group">
              <label for="usuario">Usuario</label>

              <input
                id="usuario"
                v-model="usuario"
                type="text"
                placeholder="Ingresa tu usuario"
                autocomplete="username"
                required
              />
            </div>

            <!-- Campo de contraseña -->
            <div class="form-group">
              <label for="contrasena">Contraseña</label>

              <div class="password-field">
                <input
                  id="contrasena"
                  v-model="contrasena"
                  :type="mostrarContrasena ? 'text' : 'password'"
                  placeholder="Ingresa tu contraseña"
                  autocomplete="current-password"
                  required
                />

                <!-- Permite mostrar u ocultar la contraseña -->
<button
  type="button"
  class="toggle-password"
  :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
  :aria-pressed="mostrarContrasena"
  @click="mostrarContrasena = !mostrarContrasena"
>
  <!-- Ojo abierto: contraseña visible -->
  <svg
    v-if="mostrarContrasena"
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>

  <!-- Ojo cerrado: contraseña oculta -->
  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="m15 18-.722-3.25"/>
    <path d="M2 8a10.645 10.645 0 0 0 20 0"/>
    <path d="m20 15-1.726-2.05"/>
    <path d="m4 15 1.726-2.05"/>
    <path d="m9 18 .722-3.25"/>
  </svg>
</button>
              </div>
            </div>

            <!-- Inicia sesión utilizando la autenticación JWT del backend. -->
                  <button
                    type="submit"
                    class="login-button"
                    :disabled="cargando"
                  >
                    {{ cargando ? 'Iniciando sesión...' : 'Iniciar sesión' }}
                  </button>

                  <!-- Muestra los errores devueltos durante la autenticación. -->
                  <p v-if="error" role="alert">
                    {{ error }}
                  </p>
          </form>

          <p class="security-text">
            🔒 Acceso exclusivo para usuarios autorizados
          </p>
        </div>

        <p class="form-footer">
          © 2026 SICOP. Todos los derechos reservados.
        </p>
      </section>

    </div>
  </main>
</template>

<style scoped>
/* Página principal del login */
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f7f3fc, #eae0f6);
  font-family: 'Segoe UI', Arial, sans-serif;
}

/* Contenedor de los dos paneles */
.login-container {
  width: 100%;
  max-width: 1000px;
  min-height: 0;
  height: min(650px, calc(100dvh - 32px));
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(73, 48, 120, 0.14);
}

/* Panel izquierdo */
.login-brand {
  background: linear-gradient(145deg, #493078, #7551a7);
  color: white;
  padding: 30px 36px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: 1px;
}

/* Contenedor del logo oficial */
.logo-icon {
  width: 54px;
  height: 54px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  overflow: hidden;
}

/* Imagen del logo SICOP */
.logo-sicop {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.brand-label {
  font-size: 12px;
  letter-spacing: 2px;
  color: #dfcdf5;
}

.brand-content h1 {
  font-size: clamp(30px, 3vw, 42px);
  line-height: 1.2;
  margin: 20px 0;
}

.brand-content h1 span {
  display: block;
  color: #e1c9ff;
}

.brand-content p {
  color: #e6d9f6;
  line-height: 1.8;
  font-size: 15px;
}

.brand-features {
  margin-top: 35px;
  display: grid;
  gap: 15px;
  font-size: 14px;
  color: #f0e6fc;
}

.brand-footer {
  font-size: 12px;
  color: #d7c4ec;
}

/* Panel derecho */
.login-form-panel {
  padding: 28px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
  margin: auto;
}

.welcome-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  background: #eee5f7;
  color: #7551a7;
  border-radius: 14px;
  font-size: 25px;
  margin-bottom: 25px;
}

h2 {
  font-size: 30px;
  color: #33234d;
  margin-bottom: 10px;
}

.form-subtitle {
  color: #87799a;
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 35px;
}

.form-group {
  margin-bottom: 22px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #493078;
  margin-bottom: 9px;
}

input {
  width: 100%;
  padding: 14px;
  box-sizing: border-box;
  border: 1px solid #e5dcef;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  background: #fdfbff;
  color: #33234d;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus {
  border-color: #9670c4;
  box-shadow: 0 0 0 3px rgba(150, 112, 196, 0.12);
}

.password-field {
  position: relative;
}

/* Espacio para el ícono del ojo */
.password-field input {
  padding-right: 58px;
}

 /* Botón para mostrar u ocultar contraseña */
.toggle-password {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);

  display: flex;
  align-items: center;
  justify-content: center;

  width: 34px;
  height: 34px;

  background: transparent;
  border: none;
  border-radius: 8px;

  color: #7551a7;
  cursor: pointer;

  transition: color 0.2s, background 0.2s;
}

/* Efecto al pasar el cursor */
.toggle-password:hover {
  color: #493078;
  background: #f0e8f8;
}

/* Accesibilidad al navegar con teclado */
.toggle-password:focus-visible {
  outline: 2px solid #7551a7;
  outline-offset: 2px;
}

.login-button {
  width: 100%;
  padding: 15px;
  background: #7551a7;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 15px;
  margin-top: 12px;
}

.login-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.security-text {
  text-align: center;
  margin-top: 28px;
  color: #87799a;
  font-size: 12px;
}

.form-footer {
  text-align: center;
  color: #a69bb2;
  font-size: 12px;
}

/* Diseño adaptable a celulares */
@media (max-width: 768px) {
  .login-page {
    padding: 14px;
  }

  .login-container {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
  }

  .login-brand {
    padding: 28px;
    gap: 24px;
  }

  .brand-content h1 {
    font-size: 28px;
  }

  .brand-features,
  .brand-footer {
    display: none;
  }

  .login-form-panel {
    padding: 32px 24px;
  }

  .form-wrapper {
    max-width: none;
  }

  .form-footer {
    margin-top: 30px;
  }
}

/* Ajustes para computadoras con pantallas de poca altura */
@media (min-width: 769px) and (max-height: 750px) {
  .login-container {
    height: auto;
    min-height: 0;
  }

  .login-brand,
  .login-form-panel {
    padding: 22px 32px;
  }

  .brand-content h1 {
    font-size: 30px;
    margin: 12px 0;
  }

  .brand-content p {
    line-height: 1.5;
    font-size: 13px;
  }

  .brand-features {
    margin-top: 18px;
    gap: 9px;
    font-size: 13px;
  }

  .welcome-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 12px;
  }

  h2 {
    font-size: 25px;
    margin-bottom: 6px;
  }

  .form-subtitle {
    margin-bottom: 18px;
  }

  .form-group {
    margin-bottom: 14px;
  }

  input {
    padding: 11px 14px;
  }

  .login-button {
    padding: 12px;
    margin-top: 6px;
  }

  .security-text {
    margin-top: 16px;
  }
}
</style>
