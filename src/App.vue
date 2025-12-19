<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import ActionSelect from './components/ActionSelect.vue'
import PaymentForm from './components/PaymentForm.vue'
import PaymentMethodSelect from './components/PaymentMethodSelect.vue'
import WalletSelect from './components/WalletSelect.vue'
import { useRoute } from 'vue-router'
import { useWalletStore } from '@/stores/wallets'
import { useTransactionsStore } from '@/stores/transactions'
import { processTonderPayment } from '@/services/tonder'
import { processSpeiPayment } from '@/services/spei'


type Step = 'wallet' | 'action' | 'method' | 'form'


const route = useRoute()
const walletStore = useWalletStore()
const transactions = useTransactionsStore()

const storeWallets = computed(() => walletStore.wallets)

const actions = [
  {
    id: 'deposit',
    title: 'Ingresar Dinero',
    description: 'Payment / Recibir fondos',
    accent: '#22c55e',
    icon: 'down' as const,
  },
  {
    id: 'withdraw',
    title: 'Retirar Fondos',
    description: 'Withdrawal / Enviar a banco',
    accent: '#3b82f6',
    icon: 'up' as const,
  },
]

const storeMethods = computed(() => walletStore.methods)


onMounted(() => {
  const token = (route.query.token as string) || ''
  const plataformId = Number(route.query.plataformId || route.query.platformId)
  if (token && plataformId) {
    walletStore.setAuth(plataformId, token)
    walletStore.fetchWallets()
  }
})
watch(
  () => route.query,
  (query) => {
    const token = (query.token as string) || ''
    const plataformId = Number(query.plataformId || query.platformId)

    if (token && plataformId) {
      walletStore.setAuth(plataformId, token)
      walletStore.fetchWallets()
    }
  },
  { immediate: true }
)

const step = ref<Step>('wallet')
const selectedWallet = ref<number | null>(storeWallets.value[0]?.id ?? null)
const selectedAction = ref<string | null>(null)
const selectedMethod = ref<number | null>(null)
const isSubmitting = ref(false)

const stepOrder = computed<Step[]>(() =>
  selectedAction.value === 'withdraw'
    ? ['wallet', 'action', 'form']
    : ['wallet', 'action', 'method', 'form'],
)

const currentWallet = computed(() => storeWallets.value.find((wallet) => wallet.id === selectedWallet.value))
const currentMethod = computed(() => storeMethods.value.find((method) => method.id === selectedMethod.value))

const stepTitle = computed(() => {
  if (step.value === 'action') {
    return `${currentWallet.value?.name ?? 'Billetera'} - Que deseas hacer?`
  }
  if (step.value === 'method') {
    return 'Selecciona tu metodo de pago'
  }
  if (step.value === 'form') {
    return selectedAction.value === 'withdraw' ? 'Completar Retiro' : 'Completar Pago'
  }
  return 'Hola! Selecciona tu billetera'
})

const methodLabel = computed(() => {
  if (selectedAction.value === 'withdraw') {
    return 'Retiro'
  }
  return currentMethod.value?.name ?? 'Metodo'
})

const resolveTonderMethodId = () => {
  const method = currentMethod.value as any
  const rawValue =
    method?.tonderMethod ??
    method?.tonder_method ??
    method?.paymentMethod ??
    method?.payment_method ??
    method?.code ??
    method?.slug ??
    method?.name ??
    method?.id

  const raw = rawValue !== undefined && rawValue !== null ? String(rawValue) : ''
  const normalized = raw.toLowerCase()

  console.log(raw)
  if (normalized.includes('spei')) return 'spei'
  if (normalized.includes('oxxo')) return 'oxxopay'
  if (normalized.includes('cash') || normalized.includes('efectivo')) return 'cash'

  return raw || 'oxxopay'
}

const stepPosition = computed(() => stepOrder.value.indexOf(step.value) + 1)
const totalSteps = computed(() => stepOrder.value.length)

const goPrevStep = () => {
  const idx = stepOrder.value.indexOf(step.value)
  const prevStep = stepOrder.value[idx - 1]
  if (prevStep) {
    step.value = prevStep
  }
}

const selectWallet = (id: number) => {
  selectedWallet.value = id
  selectedAction.value = null
  selectedMethod.value = null
  step.value = 'action'
}

const selectAction = (id: string) => {
  selectedAction.value = id
  selectedMethod.value = null
  step.value = id === 'withdraw' ? 'form' : 'method'
}

const selectMethod = (id: number) => {
  selectedMethod.value = id
  step.value = 'form'
}

const handleSubmit = async (payload: { amount: number; fullName: string; email: string }) => {
  if (isSubmitting.value) return

  if (selectedAction.value === "withdraw") {
    alert("El flujo de retiro aun no esta implementado.")
    return
  }
  if (!selectedMethod.value) {
    alert("Selecciona un metodo de pago.")
    return
  }

  isSubmitting.value = true

  const body = {
    clientId: Number((walletStore as any).user?.id ?? route.query.clientId ?? 0),
    walletId: Number(selectedWallet.value ?? walletStore.wallets[0]?.id ?? 0),
    amount: payload.amount,
    type: "payment",
    token: String(route.query.token ?? ""),
    coin: String(route.query.currency ?? ""),
  }
  try {
    const customerId = await transactions.createTransaction(body)
    console.info("Transaccion generada en backend:", customerId)

    const walletName = (currentMethod.value?.name || '').toLowerCase()
    let message = ''
    console.log("name",walletName)
    if (walletName === 'spei') {

      message = await processSpeiPayment({
        amount: payload.amount,
        fullName: payload.fullName,
        email: payload.email,
        customerId: String(customerId),
        currency: (route.query.currency as string) || "MXN",
      })
      
    } 
    if(walletName == "oxxo pay"){
      message = await processTonderPayment({
        amount: payload.amount,
        fullName: payload.fullName,
        email: payload.email,
        customerId: String(customerId),
        currency: (route.query.currency as string) || "MXN",
      })
    }
    console.info('Datos listos para enviar', {
      ...payload,
      wallet: currentWallet.value?.name ?? 'N/D',
      action: selectedAction.value,
      method: currentMethod.value?.name ?? 'N/D',
    })

    alert(message)

  } catch (err) {
    console.error('Error al generar la transaccion o iniciar el pago:', err)
    alert('Hubo un error creando la transaccion o iniciando el pago.')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="page">
    <div class="bg-gradients">
      <div class="blob blob-green" />
      <div class="blob blob-blue" />
    </div>
    <section class="card">
      <div class="header">
        <div>
          <div class="title-row">
            <button v-if="stepPosition > 1" type="button" class="circle-btn" aria-label="Volver" @click="goPrevStep">
              <span>&lt;</span>
            </button>
            <p class="eyebrow">Paralela de pagos</p>
          </div>
          <h1>{{ stepTitle }}</h1>
        </div>
        <p class="step">Paso {{ stepPosition }} de {{ totalSteps }}</p>
      </div>

      <div class="content">
        <WalletSelect v-if="step === 'wallet'" :wallets="storeWallets" :selected-id="selectedWallet"
          @select="selectWallet" />

        <ActionSelect v-else-if="step === 'action'" :actions="actions" :selected-id="selectedAction"
          @select="selectAction" />

        <PaymentMethodSelect v-else-if="step === 'method'" :methods="storeMethods" :selected-id="selectedMethod"
          @select="selectMethod" />

        <PaymentForm v-else :method-label="methodLabel" :wallet-label="currentWallet?.name ?? 'Billetera'"
           :loading="isSubmitting" @submit="handleSubmit" />
      </div>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: 'Manrope', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  /* background: #0f172a; */
}

.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  /* padding: 28px 18px 42px;
  background: radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.16), transparent 32%),
    radial-gradient(circle at 90% 10%, rgba(34, 197, 94, 0.12), transparent 24%),
    radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.12), transparent 30%),
    #0f172a; */
}

.bg-gradients {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.blob {
  position: absolute;
  width: 460px;
  height: 460px;
  filter: blur(120px);
  opacity: 0.5;
}

.blob-green {
  background: #22c55e;
  top: -140px;
  left: -120px;
}

.blob-blue {
  background: #3b82f6;
  bottom: -180px;
  right: -160px;
}

.card {
  position: relative;
  z-index: 1;
  width: min(960px, 100%);
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 22px 24px 26px;
  box-shadow:
    0 24px 64px rgba(15, 23, 42, 0.24),
    0 6px 18px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(6px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 14px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.circle-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #0f172a;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
  display: grid;
  place-items: center;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease;
}

.circle-btn:hover {
  transform: translateY(-1px);
  border-color: #cbd5e1;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.16);
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #6b7280;
  font-weight: 700;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(22px, 3vw, 28px);
  line-height: 1.2;
}

.step {
  margin: 0;
  color: #475569;
  font-weight: 700;
  background: #f1f5f9;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.content {
  margin-top: 6px;
}

@media (max-width: 640px) {
  .card {
    padding: 18px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .step {
    align-self: flex-start;
  }
}
</style>

