
<script setup lang="ts">
// Importamos RouterView para mostrar las pantallas
// según la dirección de navegación.
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- Aquí se mostrará el Login y las futuras vistas -->
  <RouterView />
</template>

<style>
/* Estilos generales de SICOP */
* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
}

body {
  font-family: 'Segoe UI', Arial, sans-serif;
}
</style>

