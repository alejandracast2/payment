<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import ActionSelect from './components/ActionSelect.vue'
import PaymentForm from './components/PaymentForm.vue'
import PaymentSuccess from './components/PaymentSuccess.vue'
import WithdrawForm from './components/WithdrawForm.vue'
import PaymentMethodSelect from './components/PaymentMethodSelect.vue'
import WalletSelect from './components/WalletSelect.vue'
import { useRoute } from 'vue-router'
import { useWalletStore } from '@/stores/wallets'
import { useTransactionsStore } from '@/stores/transactions'
import { processTonderPayment } from '@/services/tonder'
import { processSpeiPayment } from '@/services/spei'
import { processCashPayment } from '@/services/cash'


type Step = 'wallet' | 'action' | 'method' | 'form'
type StoreSelection = { id: string; name: string; channel: string }
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
const showPaymentSuccess = computed(
  () => route.path === '/payment-success' || route.query.paymentStatus === 'success'
)

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

const handleSubmit = async (payload: {
  amount: number
  fullName: string
  email: string
}) => {
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
    if (walletName === 'spei') {
      message = await processSpeiPayment({
        amount: payload.amount,
        fullName: payload.fullName,
        email: payload.email,
        customerId: String(customerId),
        currency: (route.query.currency as string) || "MXN",
      })
      
    } else if (walletName == "oxxo pay") {
      message = await processTonderPayment({
        amount: payload.amount,
        fullName: payload.fullName,
        email: payload.email,
        customerId: String(customerId),
        currency: (route.query.currency as string) || "MXN",
      })
    } else if (walletName === 'efectivo') {
      message = await processCashPayment({
        amount: payload.amount,
        fullName: payload.fullName,
        email: payload.email,
        customerId: String(customerId),
        currency: (route.query.currency as string) || 'MXN'
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
      <PaymentSuccess v-if="showPaymentSuccess" />
      <template v-else>
        <div class="header">
          <div>
            <div class="title-row">
              <button v-if="stepPosition > 1" type="button" class="circle-btn" aria-label="Volver" @click="goPrevStep">
                <span>&lt;</span>
              </button>
              <p class="eyebrow">Pasarela de pagos</p>
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

          <WithdrawForm v-else-if="step === 'form' && selectedAction === 'withdraw'"
            :wallet-label="currentWallet?.name ?? 'Billetera'" :wallet-id="selectedWallet" />

          <PaymentForm v-else-if="step === 'form'" :method-label="methodLabel"
            :wallet-label="currentWallet?.name ?? 'Billetera'" :loading="isSubmitting" @submit="handleSubmit" />
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: 'Manrope', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #202021;
  color: #f8fafc;
  color-scheme: dark;
  --bg: #0b0b0b;
  --bg-elev: #242525;
  --surface: #2F3330;
  --surface-2: #232121;
  --surface-strong: #101010;
  --border: rgba(56, 56, 57, 0.18);
  --text: #f8fafc;
  --text-soft: #cbd5e1;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --button-gradient: linear-gradient(rgb(240, 66, 66) 0%, rgb(0, 0, 0) 100%);
  --button-shadow: 0 14px 32px rgba(240, 66, 66, 0.25), 0 6px 12px rgba(0, 0, 0, 0.6);
  --focus-ring: rgba(240, 66, 66, 0.35);
  --badge-gradient: linear-gradient(135deg, rgba(240, 66, 66, 0.45), rgba(0, 0, 0, 0.9));
}

.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  position: relative;
  background:
    radial-gradient(circle at 10% 20%, rgba(240, 66, 66, 0.22), transparent 38%),
    radial-gradient(circle at 85% 15%, rgba(47, 34, 26, 0.12), transparent 35%),
    radial-gradient(circle at 75% 80%, rgba(44, 41, 38, 0.7), transparent 48%),
    var(--bg);
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
  top: -140px;
  left: -120px;
}

.blob-blue {
  bottom: -180px;
  right: -160px;
}

.card {
  position: relative;
  z-index: 1;
  width: min(960px, 100%);
  background: var(--surface);
  border-radius: 20px;
  padding: 22px 24px 26px;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.6),
    0 6px 18px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border);
  backdrop-filter: blur(10px);
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
  border: 1px solid rgba(240, 66, 66, 0.45);
  background: var(--button-gradient);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    filter 140ms ease;
}

.circle-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(240, 66, 66, 0.7);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.65);
  filter: brightness(1.05);
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
  font-weight: 700;
}

h1 {
  margin: 0;
  color: var(--text);
  font-size: clamp(22px, 3vw, 28px);
  line-height: 1.2;
}

.step {
  margin: 0;
  color: var(--text-soft);
  font-weight: 700;
  background: rgba(89, 88, 88, 0.7);
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.content {
  margin-top: 6px;
}

@media (max-width: 640px) {
  .page {
    padding: 20px 14px 30px;
    place-items: start center;
  }

  .blob {
    width: 320px;
    height: 320px;
    filter: blur(90px);
  }

  .card {
    padding: 16px;
    border-radius: 16px;
    box-shadow:
      0 18px 40px rgba(0, 0, 0, 0.55),
      0 6px 14px rgba(0, 0, 0, 0.45);
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .circle-btn {
    width: 32px;
    height: 32px;
  }

  .eyebrow {
    font-size: 12px;
  }

  h1 {
    font-size: clamp(20px, 6vw, 24px);
  }

  .step {
    align-self: flex-start;
    font-size: 12px;
    padding: 6px 10px;
  }
}
</style>
