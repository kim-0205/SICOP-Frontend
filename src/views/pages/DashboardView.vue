
<script setup lang="ts">
// SICOP - Dashboard administrativo.
// Los datos reales se integrarán posteriormente
// utilizando los servicios del backend .NET.
</script>

<template>
  <main class="dashboard">

    <!-- Encabezado principal -->
    <header class="dashboard-header">
      <div>
        <h1>Panel principal</h1>
        <p>
          Bienvenido al Sistema de Cuentas por Pagar.
        </p>
      </div>

      <span class="dashboard-label">
        Resumen general
      </span>
    </header>

    <!-- Tarjetas de información -->
    <section class="stats-grid">

      <article class="stat-card">
        <div class="stat-icon">♙</div>
        <p>Total de proveedores</p>
        <h2>—</h2>
        <span>Proveedores registrados</span>
      </article>

      <article class="stat-card">
        <div class="stat-icon">▤</div>
        <p>Facturas registradas</p>
        <h2>—</h2>
        <span>Facturas de compra</span>
      </article>

      <article class="stat-card">
        <div class="stat-icon">◈</div>
        <p>Saldo pendiente</p>
        <h2>—</h2>
        <span>Cuentas pendientes de pago</span>
      </article>

      <article class="stat-card">
        <div class="stat-icon">✓</div>
        <p>Pagos registrados</p>
        <h2>—</h2>
        <span>Movimientos realizados</span>
      </article>

    </section>

    <!-- Información adicional -->
    <section class="dashboard-content">

      <article class="content-card">
        <h3>Facturas recientes</h3>
        <p class="card-description">
          Últimas facturas registradas en el sistema.
        </p>

        <div class="empty-state">
          <span>▤</span>
          <p>Sin información disponible</p>
          <small>
            Aquí se mostrarán las facturas recientes.
          </small>
        </div>
      </article>

      <article class="content-card">
        <h3>Actividad reciente</h3>
        <p class="card-description">
          Últimos movimientos de SICOP.
        </p>

        <div class="empty-state">
          <span>◷</span>
          <p>Sin movimientos recientes</p>
          <small>
            Aquí aparecerán los pagos y registros.
          </small>
        </div>
      </article>

    </section>

  </main>
</template>

<style scoped>
/* Contenedor principal */
.dashboard {
  min-height: 100vh;
  padding: 36px;
  background: #f8f5fc;
  font-family: 'Segoe UI', Arial, sans-serif;
}

/* Encabezado */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.dashboard-header h1 {
  margin: 0 0 8px;
  color: #33234d;
  font-size: 30px;
}

.dashboard-header p {
  margin: 0;
  color: #89799d;
  font-size: 14px;
}

.dashboard-label {
  padding: 10px 18px;
  background: #eee5f7;
  color: #7551a7;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

/* Cuadrícula de estadísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

/* Tarjetas */
.stat-card {
  background: white;
  border: 1px solid #eee5f7;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 5px 18px rgba(73, 48, 120, 0.04);
}

.stat-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: #eee5f7;
  color: #7551a7;
  border-radius: 12px;
  font-size: 23px;
  margin-bottom: 20px;
}

.stat-card p {
  color: #89799d;
  font-size: 14px;
  margin: 0;
}

.stat-card h2 {
  font-size: 30px;
  color: #493078;
  margin: 12px 0;
}

.stat-card span {
  color: #a69bb2;
  font-size: 12px;
}

/* Secciones inferiores */
.dashboard-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.content-card {
  background: white;
  border: 1px solid #eee5f7;
  border-radius: 16px;
  padding: 26px;
}

.content-card h3 {
  color: #33234d;
  font-size: 18px;
  margin: 0 0 8px;
}

.card-description {
  color: #89799d;
  font-size: 13px;
}

/* Estados vacíos */
.empty-state {
  min-height: 230px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-state span {
  color: #b79ad9;
  font-size: 35px;
}

.empty-state p {
  color: #493078;
  font-weight: 600;
  margin-bottom: 5px;
}

.empty-state small {
  color: #a69bb2;
}

/* Adaptación a pantallas medianas */
@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Adaptación a celulares */
@media (max-width: 650px) {
  .dashboard {
    padding: 20px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid,
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>
