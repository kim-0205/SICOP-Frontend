/// <reference types="vite/client" />

// Permite que TypeScript reconozca los archivos .vue.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, any>
  export default component
}
