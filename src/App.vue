
<script setup lang="ts">
import { ref } from 'vue'
import { apiGet } from './services/api'

// Mensaje del estado de conexión.
const resultado = ref('Sin probar')

// JSON recibido desde el Backend.
const jsonProveedores = ref('')

// Consultar los proveedores de SICOP.
async function probarConexion() {
  resultado.value = 'Conectando con SICOP...'
  jsonProveedores.value = ''

  try {
    // Obtener proveedores desde nuestra API .NET.
    const proveedores = await apiGet<unknown[]>('/api/Proveedores')

    // Mostrar si la conexión fue exitosa.
    resultado.value =
      `Conexión exitosa. Proveedores encontrados: ${proveedores.length}`

    // Convertir los datos a JSON legible.
    jsonProveedores.value = JSON.stringify(proveedores, null, 2)

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

    <!-- Estado de la conexión -->
    <p>{{ resultado }}</p>

    <!-- Mostrar los proveedores en formato JSON -->
    <pre v-if="jsonProveedores">{{ jsonProveedores }}</pre>
  </main>
</template>
