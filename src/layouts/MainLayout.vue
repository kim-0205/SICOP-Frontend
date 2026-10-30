
<script setup lang="ts">
// Importamos el menú lateral.
import Sidebar from '../components/Sidebar.vue'

// Importamos el encabezado superior.
import Header from '../components/Header.vue'

// Permite mostrar las diferentes páginas del sistema.
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- Estructura principal de SICOP -->
  <div class="main-layout">

    <!-- Menú lateral izquierdo -->
    <Sidebar />

    <!-- Área administrativa -->
    <div class="main-content">

      <!-- Encabezado superior -->
      <Header />

      <!-- Aquí se mostrarán las vistas del sistema -->
      <div class="page-content">
        <RouterView />
      </div>

    </div>

  </div>
</template>

<style scoped>
/* Estructura general */
.main-layout {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: #f8f5fc;
}

/* Contenedor derecho */
.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f8f5fc;
}

/* Espacio para las páginas administrativas */
.page-content {
  flex: 1;
  min-width: 0;
}

/* Adaptación para dispositivos móviles */
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }

  .main-content {
    width: 100%;
  }
}
</style>
