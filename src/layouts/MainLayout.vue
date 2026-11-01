
<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue'
import Header from '../components/Header.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="main-layout">
    <Sidebar />

    <div class="main-content">
      <Header />

      <div class="page-content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: #f8f5fc;
}

.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f8f5fc;
}

.page-content {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }

  .main-content {
    width: 100%;
  }
}
</style>
