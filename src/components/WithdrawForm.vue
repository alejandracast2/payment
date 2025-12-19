<script setup lang="ts">
import { computed, reactive } from 'vue'

const props = defineProps<{
  walletLabel: string
  loading?: boolean
}>()

type WithdrawPayload = {
  method: 'spei' | 'card'
  idType: 'rfc' | 'curp' | 'id'
  identifier: string
  beneficiaryName: string
  beneficiaryInstitution: string
  transferMethod: string
  accountNumber: string
  accountNumberConfirm: string
  amount: number
  interbankCode: string
  interbankCodeConfirm: string
  email: string
}

const emit = defineEmits<{
  submit: [
    payload: {
      amount: number
      fullName: string
      email: string
      store: null
      withdraw: WithdrawPayload
    },
  ]
}>()

const form = reactive({
  method: 'spei' as WithdrawPayload['method'],
  idType: 'rfc' as WithdrawPayload['idType'],
  identifier: '',
  beneficiaryName: '',
  beneficiaryInstitution: '',
  transferMethod: '',
  accountNumber: '',
  accountNumberConfirm: '',
  amount: '',
  interbankCode: '',
  interbankCodeConfirm: '',
  email: '',
})

const identifierLabel = computed(() => {
  if (form.idType === 'curp') return 'CURP Entry'
  if (form.idType === 'id') return 'ID Entry'
  return 'RFC Entry'
})

const isIdentifierInvalid = computed(() => {
  const value = form.identifier.trim()
  if (!value) return false
  if (form.idType === 'rfc') return value.length < 12 || value.length > 13
  if (form.idType === 'curp') return value.length !== 18
  return value.length < 6
})

const isAccountMismatch = computed(() => {
  if (!form.accountNumberConfirm) return false
  return form.accountNumber !== form.accountNumberConfirm
})

const isInterbankMismatch = computed(() => {
  if (!form.interbankCodeConfirm) return false
  return form.interbankCode !== form.interbankCodeConfirm
})

const isFormValid = computed(() => {
  const amount = Number(form.amount)
  return Boolean(
    amount > 0 &&
      form.beneficiaryName.trim().length > 0 &&
      form.beneficiaryInstitution.trim().length > 0 &&
      form.identifier.trim().length > 0 &&
      form.accountNumber.trim().length > 0 &&
      form.interbankCode.trim().length > 0 &&
      form.email.trim().length > 0 &&
      !isIdentifierInvalid.value &&
      !isAccountMismatch.value &&
      !isInterbankMismatch.value,
  )
})

const handleSubmit = () => {
  if (!isFormValid.value || props.loading) return
  emit('submit', {
    amount: Number(form.amount || 0),
    fullName: form.beneficiaryName.trim(),
    email: form.email.trim(),
    store: null,
    withdraw: {
      method: form.method,
      idType: form.idType,
      identifier: form.identifier.trim(),
      beneficiaryName: form.beneficiaryName.trim(),
      beneficiaryInstitution: form.beneficiaryInstitution.trim(),
      transferMethod: form.transferMethod.trim(),
      accountNumber: form.accountNumber.trim(),
      accountNumberConfirm: form.accountNumberConfirm.trim(),
      amount: Number(form.amount || 0),
      interbankCode: form.interbankCode.trim(),
      interbankCodeConfirm: form.interbankCodeConfirm.trim(),
      email: form.email.trim(),
    },
  })
}
</script>

<template>
  <form class="withdraw-card" @submit.prevent="handleSubmit">
    <div class="top-row">
      <div class="brand">
        <span class="brand-icon">NB</span>
        <div>
          <p class="brand-title">{{ props.walletLabel }}</p>
          <p class="brand-subtitle">Retiro</p>
        </div>
      </div>
      <div class="segmented">
        <button type="button" class="segment" :class="{ active: form.method === 'spei' }"
          @click="form.method = 'spei'">
          SPEI
        </button>
        <button type="button" class="segment" :class="{ active: form.method === 'card' }"
          @click="form.method = 'card'">
          CARD
        </button>
      </div>
    </div>

    <div class="id-row">
      <div class="id-tabs">
        <button type="button" class="id-tab" :class="{ active: form.idType === 'rfc' }"
          @click="form.idType = 'rfc'">
          RFC
        </button>
        <button type="button" class="id-tab" :class="{ active: form.idType === 'curp' }"
          @click="form.idType = 'curp'">
          CURP
        </button>
        <button type="button" class="id-tab" :class="{ active: form.idType === 'id' }"
          @click="form.idType = 'id'">
          ID
        </button>
      </div>
      <p class="id-caption">Tipo de identificador</p>
    </div>

    <div class="fields">
      <div class="column">
        <label class="field">
          <span>Beneficiary Name <em class="required">*</em></span>
          <input v-model="form.beneficiaryName" required type="text" placeholder="Ej. Maria Lopez" />
        </label>

        <label class="field">
          <span>Beneficiary Institution <em class="required">*</em></span>
          <input v-model="form.beneficiaryInstitution" required type="text" placeholder="Banco destino" />
        </label>

        <label class="field">
          <span>Transfer Method</span>
          <input v-model="form.transferMethod" type="text" placeholder="Cuenta bancaria" />
        </label>

        <label class="field">
          <span>Beneficiary Account <em class="required">*</em></span>
          <input v-model="form.accountNumber" required type="text" placeholder="0000000000" />
        </label>

        <label class="field">
          <span>Beneficiary Account</span>
          <input v-model="form.accountNumberConfirm" type="text" placeholder="Confirmar cuenta"
            :class="{ error: isAccountMismatch }" />
          <span v-if="isAccountMismatch" class="error-text">Las cuentas no coinciden.</span>
        </label>
      </div>

      <div class="column">

        <label class="field">
          <span>{{ identifierLabel }} <em class="required">*</em></span>
          <input v-model="form.identifier" required type="text" placeholder="Ingresa el identificador"
            :class="{ error: isIdentifierInvalid }" />
          <span v-if="isIdentifierInvalid" class="error-text">Identificador invalido. Por favor verifica.</span>
        </label>

        <label class="field">
          <span>Currency Amount <em class="required">*</em></span>
          <input v-model="form.amount" required type="number" min="0" step="0.01" placeholder="$0.00" />
        </label>

        <label class="field">
          <span>Interbank Code <em class="required">*</em></span>
          <input v-model="form.interbankCode" required type="text" placeholder="CLABE" />
        </label>

        <label class="field">
          <span>Interbank Code</span>
          <input v-model="form.interbankCodeConfirm" type="text" placeholder="Confirmar CLABE"
            :class="{ error: isInterbankMismatch }" />
          <span v-if="isInterbankMismatch" class="error-text">Las claves no coinciden.</span>
        </label>

        <label class="field">
          <span>Email <em class="required">*</em></span>
          <input v-model="form.email" required type="email" placeholder="ejemplo@email.com" />
        </label>
      </div>
    </div>

    <button type="submit" class="cta" :disabled="!isFormValid || props.loading">
      <span v-if="props.loading" class="spinner" aria-hidden="true" />
      <span>{{ props.loading ? 'Generando...' : 'Transferir' }}</span>
    </button>
  </form>
</template>

<style scoped>
.withdraw-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow:
    0 16px 36px rgba(16, 24, 40, 0.12),
    0 3px 10px rgba(16, 24, 40, 0.12);
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #0f172a;
  color: #fff;
  font-weight: 700;
  display: grid;
  place-items: center;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.brand-title {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}

.brand-subtitle {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.segmented {
  display: flex;
  gap: 8px;
  padding: 4px;
  border-radius: 14px;
  background: #eef2f7;
}

.segment {
  border: none;
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 700;
  color: #334155;
  background: transparent;
  cursor: pointer;
  transition:
    background 140ms ease,
    color 140ms ease,
    box-shadow 140ms ease;
}

.segment.active {
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  color: #fff;
  box-shadow:
    0 12px 26px rgba(59, 130, 246, 0.35),
    0 4px 10px rgba(59, 130, 246, 0.24);
}

.id-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.id-tabs {
  display: flex;
  gap: 8px;
}

.id-tab {
  border: 1px solid transparent;
  background: #e2e8f0;
  color: #475569;
  border-radius: 10px;
  padding: 6px 14px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition:
    background 140ms ease,
    color 140ms ease,
    border-color 140ms ease;
}

.id-tab.active {
  background: #3b82f6;
  color: #fff;
  border-color: rgba(59, 130, 246, 0.5);
}

.id-caption {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.field input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.required {
  color: #ef4444;
  font-style: normal;
  margin-left: 4px;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
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

.cta:disabled {
  opacity: 0.7;
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

@media (max-width: 760px) {
  .fields {
    grid-template-columns: 1fr;
  }
}
</style>
