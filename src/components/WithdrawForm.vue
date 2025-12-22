<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/axios'
import { useWalletStore } from '@/stores/wallets'

const props = defineProps<{
  walletLabel: string
  walletId?: number | null
}>()

type WithdrawalRequest = {
  internal: {
    type: 'withdrawal'
    client_id: number
    wallet_id: number
    token: string
  }
  tonder: {
    amount: number
    currency: string
    transfer_method: string
    beneficiary_account: string
    beneficiary_rfc?: string
    beneficiary_curp?: string
    beneficiary_name?: string
    beneficiary_last_name?: string
    beneficiary_institution?: string
    interbank_code?: string
    email: string
    phone?: string
    description: string
  }
}

type WithdrawPayload = {
  method: 'spei' | 'card'
  idType: 'rfc' | 'curp' | 'id'
  identifier: string
  beneficiaryName: string
  beneficiaryLastName: string
  beneficiaryInstitution: string
  accountNumber: string
  amount: number
  interbankCode: string
  interbankCodeConfirm: string
  email: string
  phone: string
}

type BankOption = {
  code: string
  label: string
}

const route = useRoute()
const walletStore = useWalletStore()
const isSubmitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
const submitMessage = ref('')
const authToken = computed(() => String(walletStore.token || route.query.token || ''))
const banks = ref<BankOption[]>([])
const isBanksLoading = ref(false)
const banksError = ref('')

const form = reactive({
  method: 'spei' as WithdrawPayload['method'],
  idType: 'rfc' as WithdrawPayload['idType'],
  identifier: '',
  beneficiaryName: '',
  beneficiaryLastName: '',
  beneficiaryInstitution: '',
  accountNumber: '',
  amount: '',
  interbankCode: '',
  interbankCodeConfirm: '',
  email: '',
  phone: '',
})

const identifierLabel = computed(() => {
  if (form.idType === 'curp') return 'CURP'
  if (form.idType === 'id') return 'ND'
  return 'RFC'
})

const isNoDocument = computed(() => form.idType === 'id')

const isIdentifierInvalid = computed(() => {
  const value = form.identifier.trim()
  if (!value) return false
  if (form.idType === 'rfc') return value.length < 12 || value.length > 13
  if (form.idType === 'curp') return value.length !== 18
  return false
})

const loadBanks = async () => {
  if (!authToken.value) {
    banksError.value = 'Falta el token de autorizacion.'
    return
  }

  isBanksLoading.value = true
  banksError.value = ''
  try {
    const { data } = await api.get<BankOption[]>('tonder/bancks', {
      headers: {
        Authorization: authToken.value,
      },
    })
    banks.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error al cargar los bancos:', err)
    banksError.value = 'No se pudieron cargar los bancos.'
    banks.value = []
  } finally {
    isBanksLoading.value = false
  }
}

const isInterbankMismatch = computed(() => {
  if (!form.interbankCodeConfirm) return false
  return form.interbankCode !== form.interbankCodeConfirm
})

const isFormValid = computed(() => {
  const amount = Number(form.amount)
  const Account_number =String(form.accountNumber)
  const hasBasics =
    amount > 0 &&
    form.identifier.trim().length > 0 &&
    Account_number.trim().length > 0 &&
    form.email.trim().length > 0 &&
    String(form.phone).trim().length > 0 &&
    !isIdentifierInvalid.value

  if (form.method === 'card') {
    return Boolean(hasBasics)
  }

  return Boolean(
    hasBasics &&
      form.beneficiaryName.trim().length > 0 &&
      form.beneficiaryLastName.trim().length > 0 &&
      form.beneficiaryInstitution.trim().length > 0 &&
      form.interbankCode.trim().length > 0 &&
      !isInterbankMismatch.value,
  )
})

watch(
  () => form.method,
  (method) => {
    if (method !== 'card') return
    form.beneficiaryName = ''
    form.interbankCode = ''
    form.interbankCodeConfirm = ''
  },
)

watch(
  () => form.idType,
  (idType) => {
    if (idType === 'id') {
      form.identifier = 'ND'
    } else if (form.identifier.trim() === 'ND') {
      form.identifier = ''
    }
  },
  { immediate: true },
)

watch(
  authToken,
  (token) => {
    if (!token) {
      banksError.value = 'Falta el token de autorizacion.'
      banks.value = []
      return
    }
    if (!banks.value.length && !isBanksLoading.value) {
      void loadBanks()
    }
  },
  { immediate: true },
)

const buildWithdrawalBody = (): WithdrawalRequest => {
  const identifier = form.identifier.trim()
  const idFields =
    form.idType === 'rfc'
      ? { beneficiary_rfc: identifier }
    : form.idType === 'curp'
        ? { beneficiary_curp: identifier }
        : { beneficiary_rfc: 'ND' }

  const tonder = {
    amount: Number(form.amount || 0),
    currency: String(route.query.currency ?? 'MXN'),
    transfer_method: form.method === 'spei' ? 'SPEI' : 'DEBIT_CARD',
    beneficiary_account: String(form.accountNumber).trim(),
    beneficiary_name: form.beneficiaryName.trim(),
    beneficiary_last_name: form.beneficiaryLastName.trim(),
    interbank_code: form.method =='card' ? '646180567300000006': form.interbankCode.trim(),
    beneficiary_institution: form.method =='card' ? '97846': form.beneficiaryInstitution.trim(),
    email: form.email.trim(),
    phone: String(form.phone).trim(),
    description: form.method === 'spei' ? 'withdrawal' : 'test DEBIT_CARD RFC fee01',
    ...idFields,
  }

  // const tonder =
  //   form.method === 'spei'
  //     ? {
  //         ...tonderBase,
  //         beneficiary_institution: form.beneficiaryInstitution.trim(),
  //       }
  //     : tonderBase

  return {
    internal: {
      type: 'withdrawal',
      client_id: Number(walletStore.user?.id ?? route.query.clientId ?? 0),
      wallet_id: Number(props.walletId ?? walletStore.wallets[0]?.id ?? 0),
      token: String(walletStore.token || route.query.token || ''),
    },
    tonder,
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return
  const token = String(walletStore.token || route.query.token || '')
  if (!token) {
    submitStatus.value = 'error'
    submitMessage.value = 'Falta el token de autorizacion.'
    return
  }

  isSubmitting.value = true
  submitStatus.value = 'idle'
  submitMessage.value = ''
  try {
    const body = buildWithdrawalBody()
    await api.post('tonder/withdrawals', body)
    submitStatus.value = 'success'
    submitMessage.value = 'Transferencia generada correctamente.'
  } catch (err) {
    console.error('Error al crear el retiro:', err)
    submitStatus.value = 'error'
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    submitMessage.value = message || 'Hubo un error al crear el retiro.'
  } finally {
    isSubmitting.value = false
  }
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
          sin documento
        </button>
      </div>
      <p class="id-caption">Tipo de identificador</p>
    </div>

    <div class="fields">
      <div class="column">
        <label class="field">
          <span>Nombre <em class="required">*</em></span>
          <input v-model="form.beneficiaryName" required type="text" placeholder="Ej. Maria Lopez" />
        </label>

        <label class="field">
          <span>Apellido <em class="required">*</em></span>
          <input v-model="form.beneficiaryLastName" required type="text" placeholder="Ej. Garcia" />
        </label>

        <label v-if="form.method === 'spei'" class="field">
          <span>Banco <em class="required">*</em></span>
          <select v-model="form.beneficiaryInstitution" required :disabled="isBanksLoading">
            <option value="" disabled>
              {{ isBanksLoading ? 'Cargando bancos...' : 'Selecciona un banco' }}
            </option>
            <option v-for="bank in banks" :key="bank.code" :value="bank.code">
              {{ bank.label }}
            </option>
          </select>
          <span v-if="banksError" class="error-text">{{ banksError }}</span>
        </label>


        <label class="field">
          <span>{{ form.method === 'card' ? 'Número de tarjeta' : 'Número de cuenta' }} <em class="required">*</em></span>
          <input v-model="form.accountNumber" required type="number"
            :placeholder="form.method === 'card' ? '4111111111111111' : '0000000000'" />
        </label>

        <label class="field">
          <span>Email <em class="required">*</em></span>
          <input v-model="form.email" required type="email" placeholder="ejemplo@email.com" />
        </label>


      </div>

      <div class="column">

        <label class="field">
          <span>{{ identifierLabel }} <em class="required">*</em></span>
          <input v-model="form.identifier" required type="text" placeholder="Ingresa el identificador"
            :class="{ error: isIdentifierInvalid }" :readonly="isNoDocument" />
          <span v-if="isIdentifierInvalid" class="error-text">Identificador invalido. Por favor verifica.</span>
        </label>

        <label class="field">
          <span>Monto <em class="required">*</em></span>
          <input v-model="form.amount" required type="number" min="0" step="0.01" placeholder="$0.00" />
        </label>

        <label v-if="form.method === 'spei'" class="field">
          <span>Clabe Interbancaria<em class="required">*</em></span>
          <input v-model="form.interbankCode" required type="text" placeholder="CLABE" />
        </label>

        <label v-if="form.method === 'spei'" class="field">
          <span>Clabe Interbancaria (confirmación)</span>
          <input v-model="form.interbankCodeConfirm" type="text" placeholder="Confirmar CLABE"
            :class="{ error: isInterbankMismatch }" />
          <span v-if="isInterbankMismatch" class="error-text">Las claves no coinciden.</span>
        </label>
        <label class="field">
          <span>Celular <em class="required">*</em></span>
          <input v-model="form.phone" required type="number" placeholder="5512345678" />
        </label>
      </div>
    </div>

    <p v-if="submitStatus !== 'idle'" class="submit-message" :class="submitStatus">
      <span class="status-icon" aria-hidden="true">
        <svg v-if="submitStatus === 'success'" viewBox="0 0 24 24" role="img" focusable="false">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <svg v-else viewBox="0 0 24 24" role="img" focusable="false">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </span>
      <span class="status-text">{{ submitMessage }}</span>
    </p>

    <button type="submit" class="cta" :disabled="!isFormValid || isSubmitting">
      <span v-if="isSubmitting" class="spinner" aria-hidden="true" />
      <span>{{ isSubmitting ? 'Generando...' : 'Transferir' }}</span>
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

.field select {
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

.field select:focus {
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

.submit-message {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.submit-message.success {
  color: #0f5132;
  background: #d1e7dd;
  border: 1px solid #badbcc;
}

.submit-message.error {
  color: #842029;
  background: #f8d7da;
  border: 1px solid #f5c2c7;
}

.status-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  flex-shrink: 0;
}

.submit-message.success .status-icon {
  background: #0f5132;
}

.submit-message.error .status-icon {
  background: #842029;
}

.status-icon svg {
  width: 14px;
  height: 14px;
  stroke: #fff;
  stroke-width: 2.4;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.status-text {
  line-height: 1.4;
}

@media (max-width: 760px) {
  .fields {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .withdraw-card {
    padding: 16px;
    border-radius: 16px;
    gap: 14px;
  }

  .top-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .segmented {
    width: 100%;
  }

  .segment {
    flex: 1;
    text-align: center;
    padding: 8px 10px;
  }

  .id-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .id-tabs {
    width: 100%;
  }

  .id-tab {
    flex: 1;
    text-align: center;
    padding: 8px 10px;
  }

  .cta {
    width: 100%;
  }
}
</style>
