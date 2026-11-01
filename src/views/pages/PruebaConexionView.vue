
<script setup lang="ts">
import { ref } from 'vue'
import { apiGet } from '../../services/api'

const resultado = ref('Sin probar')
const jsonProveedores = ref('')

async function probarConexion() {
  resultado.value = 'Conectando con SICOP...'
  jsonProveedores.value = ''

  try {
    const proveedores = await apiGet<unknown[]>('/api/Proveedores')

    resultado.value =
      `Conexión exitosa. Proveedores encontrados: ${proveedores.length}`

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

    <p>{{ resultado }}</p>

    <pre v-if="jsonProveedores">{{ jsonProveedores }}</pre>
  </main>
</template>
