<script setup lang="ts">
</script>

<template>
  <div class="success">
    <div class="icon" aria-hidden="true">✓</div>
    <h2>Solicitud recibida</h2>
    <p>Tu solicitud de pago fue exitosa.</p>
  </div>
</template>

<style scoped>
.success {
  text-align: center;
  padding: 18px 10px 8px;
}

.icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #16a34a;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 800;
}

h2 {
  margin: 0 0 8px;
  color: var(--text);
}

p {
  margin: 0 0 16px;
  color: var(--text-muted);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--button-gradient);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  font-size: 14px;
}

.back-link:hover {
  filter: brightness(1.05);
}
</style>
