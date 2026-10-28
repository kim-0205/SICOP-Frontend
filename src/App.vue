
<script setup lang="ts">
import { ref } from 'vue'
import { apiGet } from './services/api'

// Resultado de nuestra prueba.
const resultado = ref('Sin probar')

// Consultar proveedores desde el Backend.
async function probarConexion() {
  resultado.value = 'Conectando con SICOP...'

  try {
    const proveedores = await apiGet<unknown[]>('/api/Proveedores')

    resultado.value =
      `Conexión exitosa. Proveedores encontrados: ${proveedores.length}`
  } catch (error) {
    console.error('Error de conexión:', error)

    resultado.value =
      error instanceof Error ? error.message : 'Error desconocido'
  }
}
</script>

<template>
  <main>
    <h1>SICOP - Prueba de conexión</h1>

    <button @click="probarConexion">
      Probar conexión con Backend
    </button>

    <p>{{ resultado }}</p>
  </main>
</template>
