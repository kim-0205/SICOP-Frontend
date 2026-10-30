
<script setup lang="ts">
import { ref } from 'vue'

// Datos que ingresará el usuario.
const usuario = ref('')
const contrasena = ref('')
const mostrarContrasena = ref(false)

// Función temporal hasta integrar el endpoint de login.
function iniciarSesion() {
  // La autenticación JWT se implementará posteriormente.
}
</script>

<template>
  <main class="login-page">
    <div class="login-container">

      <!-- Panel izquierdo: presentación del sistema -->
      <section class="login-brand">
        <div class="brand-logo">
          <span class="logo-icon">◆</span>
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

                <button
                  type="button"
                  class="toggle-password"
                  :aria-label="mostrarContrasena
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'"
                  @click="mostrarContrasena = !mostrarContrasena"
                >
                  {{ mostrarContrasena ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>
            </div>

            <!-- Se habilitará al integrar la autenticación -->
            <button
              type="submit"
              class="login-button"
              disabled
            >
              Iniciar sesión
            </button>
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
  padding: 28px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f7f3fc, #eae0f6);
  font-family: 'Segoe UI', Arial, sans-serif;
}

/* Contenedor de los dos paneles */
.login-container {
  width: 100%;
  max-width: 1100px;
  min-height: 650px;
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
  padding: 48px;
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

.logo-icon {
  background: rgba(255, 255, 255, 0.18);
  padding: 12px;
  border-radius: 12px;
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
  padding: 48px;
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

.password-field input {
  padding-right: 88px;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #7551a7;
  cursor: pointer;
  font-size: 12px;
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
    min-height: auto;
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
</style>
