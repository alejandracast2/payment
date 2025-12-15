<script setup lang="ts">
import { reactive } from 'vue'

const props = defineProps<{
  methodLabel: string
  walletLabel: string
}>()

const emit = defineEmits<{
  submit: [
    payload: {
      amount: number
      fullName: string
      email: string
    },
  ]
}>()

const form = reactive({
  amount: '',
  fullName: '',
  email: '',
})

const handleSubmit = () => {
  emit('submit', {
    amount: Number(form.amount || 0),
    fullName: form.fullName.trim(),
    email: form.email.trim(),
  })
}
</script>

<template>
  <form class="form-card" @submit.prevent="handleSubmit">
    <div class="header">
      <div class="badge">{{ props.methodLabel }}</div>
      <p class="hint">Pagando con {{ props.walletLabel }}</p>
    </div>

    <label class="field">
      <span>Monto a Pagar ($)</span>
      <input v-model="form.amount" required type="number" min="0" step="0.01" placeholder="$0.00" />
    </label>

    <label class="field">
      <span>Nombre Completo</span>
      <input v-model="form.fullName" required type="text" placeholder="Ej. Juan Pérez" />
    </label>

    <label class="field">
      <span>Correo Electrónico</span>
      <input v-model="form.email" required type="email" placeholder="ejemplo@email.com" />
    </label>

    <button type="submit" class="cta">Generar Pago</button>
  </form>
</template>

<style scoped>
.form-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow:
    0 16px 36px rgba(16, 24, 40, 0.12),
    0 3px 10px rgba(16, 24, 40, 0.12);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  padding: 6px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #60a5fa);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}

.hint {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #0f172a;
  font-weight: 600;
}

.field span {
  font-size: 14px;
}

.field input {
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  color: #0f172a;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    background 140ms ease;
}

.field input:focus {
  outline: none;
  border-color: #3f83f8;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(63, 131, 248, 0.16);
}

.cta {
  margin-top: 4px;
  padding: 13px 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    filter 140ms ease;
  box-shadow:
    0 14px 32px rgba(37, 99, 235, 0.35),
    0 6px 12px rgba(37, 99, 235, 0.2);
}

.cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.cta:active {
  transform: translateY(0);
}
</style>
