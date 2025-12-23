<script setup lang="ts">
import { reactive, computed, ref } from 'vue'

const props = defineProps<{
  methodLabel: string
  walletLabel: string
  loading?:boolean
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
  store: '',
})

const storeSelect = ref<HTMLSelectElement | null>(null)



const isFormValid = computed(() => {
  const amount = Number(form.amount)
  return Boolean(amount > 0 && form.fullName.trim().length > 0 && form.email.trim().length > 0 )
})

const handleSubmit = () => {
  if (!isFormValid.value || props.loading) return
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

    <!-- <label v-if="props.methodLabel.toLowerCase() === 'efectivo'" class="field">
      <span>🏪 Selecciona dónde pagarás</span>
      <select v-model="form.store" ref="storeSelect" required id="store" name="store" @change="updateStoreInfo">
        <option value="">-- Selecciona una tienda --</option>

        <option disabled class="store-category">🏦 BANCOS</option>
        <option value="1020" data-name="BBVA Bancomer" data-channel="WP">BBVA Bancomer</option>
        <option value="8395" data-name="Santander" data-channel="WP">Santander</option>
        <option value="1007" data-name="Scotiabank" data-channel="WP">Scotiabank</option>
        <option value="8186" data-name="Banco Azteca" data-channel="WP">Banco Azteca</option>

        <option disabled class="store-category">🏪 TIENDAS DE CONVENIENCIA</option>
        <option value="1140" data-name="Oxxo" data-channel="WP">Oxxo</option>
        <option value="8178" data-name="7-Eleven" data-channel="WP">7-Eleven</option>
        <option value="8178" data-name="CircleK" data-channel="WP">Circle K</option>
        <option value="8178" data-name="Kiosko" data-channel="WP">Kiosko</option>

        <option disabled class="store-category">🛒 SUPERMERCADOS</option>
        <option value="8178" data-name="Walmart" data-channel="WP">Walmart</option>
        <option value="8178" data-name="Bodega Aurrera" data-channel="WP">Bodega Aurrera</option>
        <option value="8178" data-name="Sam's Club" data-channel="WP">Sam's Club</option>
        <option value="8419" data-name="Soriana" data-channel="WP">Soriana</option>
        <option value="8419" data-name="Calimax" data-channel="WP">Calimax</option>
        <option value="8178" data-name="Extra" data-channel="WP">Extra</option>
        <option value="8178" data-name="Waldo's" data-channel="WP">Waldo's</option>

        <option disabled class="store-category">💊 FARMACIAS</option>
        <option value="8419" data-name="Super Farmacia Santa Maria" data-channel="WP">Super Farmacia Santa María</option>
        <option value="8419" data-name="Farmacia la Más Barata" data-channel="WP">Farmacia la Más Barata</option>
        <option value="8419" data-name="Roma" data-channel="WP">Farmacia Roma</option>
        <option value="8178" data-name="Farmacias de Ahorro" data-channel="WP">Farmacias del Ahorro</option>
        <option value="8178" data-name="Super Farmacia Guadalajara" data-channel="WP">Farmacia Guadalajara</option>

        <option disabled class="store-category">💳 SERVICIOS DE PAGO</option>
        <option value="8178" data-name="GestoPago" data-channel="WP">GestoPago</option>
        <option value="8178" data-name="Pago Rápido" data-channel="WP">Pago Rápido</option>
        <option value="8178" data-name="OpenPay" data-channel="WP">OpenPay</option>
        <option value="8419" data-name="PayCash" data-channel="WP">PayCash</option>
      </select>
      <div v-if="storeInfo" class="store-info" id="storeInfo" aria-live="polite">
        <strong>{{ storeInfo.name }}</strong><br />
        Tipo: Pago en Efectivo | Bank ID: {{ storeInfo.id }}
      </div>
    </label> -->

    <button type="submit" class="cta" :disabled="!isFormValid || props.loading">
      <span v-if="props.loading" class="spinner" aria-hidden="true" />
      <span>{{ props.loading ? 'Generando...' : 'Generar Pago' }}</span>
    </button>
  </form>
</template>

<style scoped>
.form-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--surface);
  border-radius: 18px;
  padding: 18px;
  border: 1px solid var(--border);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.55),
    0 3px 10px rgba(0, 0, 0, 0.45);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  padding: 6px 12px;
  border-radius: 12px;
  background: rgba(240, 66, 66, 0.18);
  color: var(--text);
  border: 1px solid rgba(240, 66, 66, 0.35);
  font-weight: 700;
  font-size: 13px;
}

.hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-soft);
  font-weight: 600;
}

.field span {
  font-size: 14px;
}

.field input,
.field select {
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-strong);
  color: var(--text);
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    background 140ms ease;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: rgba(240, 66, 66, 0.7);
  background: #000000;
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.field select option {
  color: #e2e8f0;
}

.store-category {
  color: var(--text-muted);
  font-weight: 700;
}

.store-info {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.75);
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 600;
}



.cta {
  margin-top: 4px;
  padding: 13px 14px;
  border: none;
  border-radius: 12px;
  background: var(--button-gradient);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    filter 140ms ease;
  box-shadow: var(--button-shadow);
}

.cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.cta:active {
  transform: translateY(0);
}
.cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.cta .spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  display: inline-block;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .form-card {
    padding: 16px;
    border-radius: 16px;
    gap: 12px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .badge {
    font-size: 12px;
  }

  .hint {
    font-size: 12px;
  }

  .field span {
    font-size: 13px;
  }

  .field input,
  .field select {
    padding: 11px 12px;
  }

  .cta {
    width: 100%;
  }
}
</style>
