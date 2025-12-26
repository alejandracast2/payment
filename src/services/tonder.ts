import {api} from '@/api/axios'



type BrowserInfo = {
  javascript_enabled: boolean
  time_zone: number
  language: string
  color_depth: number
  screen_width: number
  screen_height: number
  user_agent: string
}

type TonderPaymentItem = {
  description: string
  quantity: number
  price_unit: number
  discount: number
  taxes: number
  product_reference: string
  name: string
  amount_total: number
}

export type TonderPaymentPayload = {
  customer: {
    firstName: string
    lastName: string
    email: string
    country: string
    address: string
    city: string
    state: string
    postCode: string
    phone: string
  }
  name: string
  last_name: string
  email_client: string
  phone_number: string
  currency: string
  cart: {
    total: number
    items: TonderPaymentItem[]
  }
  items: TonderPaymentItem[]
  metadata: Record<string, string>
  order_reference: string
  order_id: number
  payment_id: number
  business_id: number
  payment_method: string
  return_url: string
  id_product: string
  quantity_product: number
  id_ship: string
  instance_id_ship: string
  title_ship: string
  description: string
  device_session_id: string | null
  token_id: string
  source: string
  browser_info: BrowserInfo
  identification: {
    type: string
    number: string
  }
  apm_config: Record<string, unknown>
  amount?: number
}



export type TonderPaymentResponse = {
  status?: number
  message?: string
  error?: string
  checkout_url?: string
  payment_url?: string
  redirect_url?: string
  reference?: string
  payment_reference?: string
  checkout_id?: string
  next_action?: {
    redirect_to_url?: {
      url?: string
    }
  }
  [key: string]: unknown
}

interface LiteInlineCheckout {
  injectCheckout: () => Promise<void>
  configureCheckout: (config: { customer: { firstName: string; lastName: string; email: string } }) => Promise<void> | void
  payment: (payload: TonderPaymentPayload) => Promise<TonderPaymentResponse>
}

interface LiteInlineCheckoutCtor {
  new (config: { mode: string; apiKey: string; returnUrl: string }): LiteInlineCheckout
}

interface TonderSdkGlobal {
  LiteInlineCheckout: LiteInlineCheckoutCtor
}

declare global {
  interface Window {
    TonderSdk?: TonderSdkGlobal
  }
}

const PAYMENT_SUCCESS_PATH = '/payment-success'
const TONDER_CONFIG = {
  mode: 'stage',
  apiKey: '1cccb499af3ad62bfb10a6efab1b07910b0bc39b',
  returnUrl: `${window.location.origin}/#${PAYMENT_SUCCESS_PATH}`,
}

const trackOxxoPayment = async (params: { customerId: string; payload: TonderPaymentPayload }) => {
  const body = {
    transactionId: params.customerId,
    event: 'payment oxxopay',
    dataEvent: JSON.stringify(params.payload),
  }

  const { data } = await api.post('trackings/by-uuid', body)
  return data
}

let liteCheckout: LiteInlineCheckout | null = null
let scriptsLoaded = false

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("No se pudo cargar el script " + src))
    document.head.appendChild(script)
  })

const loadExternalScripts = async () => {
  if (scriptsLoaded) return
  await loadScript('https://js.skyflow.com/v1/index.js')
  await loadScript('https://openpay.s3.amazonaws.com/openpay.v1.min.js')
  await loadScript('https://openpay.s3.amazonaws.com/openpay-data.v1.min.js')
  await loadScript('https://zplit-stage.s3.amazonaws.com/v1/bundle.min.js')
  scriptsLoaded = true
}

const getBrowserInfo = (): BrowserInfo => ({
  javascript_enabled: true,
  time_zone: new Date().getTimezoneOffset(),
  language: navigator.language || 'en-US',
  color_depth: window.screen?.colorDepth ?? 24,
  screen_width: window.screen?.width ?? 0,
  screen_height: window.screen?.height ?? 0,
  user_agent: navigator.userAgent,
})

const ensureLiteCheckout = async (): Promise<LiteInlineCheckout> => {
  await loadExternalScripts()
  const ctor = window.TonderSdk?.LiteInlineCheckout
  if (!ctor) {
    throw new Error('Tonder SDK Lite no está disponible. Asegúrate de cargar el script de TonderSdk.')
  }
  if (!liteCheckout) {
    liteCheckout = new ctor({
      mode: TONDER_CONFIG.mode,
      apiKey: TONDER_CONFIG.apiKey,
      returnUrl: TONDER_CONFIG.returnUrl,
    })
    await liteCheckout.injectCheckout()
  }
  return liteCheckout
}

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] ?? 'Nombre'
  const lastName = parts.slice(1).join(' ') || 'Apellido'
  return { firstName, lastName }
}

const buildPaymentPayload = (params: {
  amount: number
  firstName: string
  lastName: string
  email: string
  paymentMethod: string
  customerId: string
  currency: string
}): TonderPaymentPayload => {
  const items: TonderPaymentItem[] = [
    {
      description: 'Product',
      quantity: 1,
      price_unit: params.amount,
      discount: 0,
      taxes: 0,
      product_reference: 'PROD001',
      name: 'Tonder Product',
      amount_total: params.amount,
    },
  ]

  const orderId = Math.floor(Date.now() / 1000)
  const paymentId = Math.floor(Math.random() * 90000) + 10000
  const orderReference = `ORDER-${Math.random().toString(36).slice(2, 11).toUpperCase()}`

  return {
    customer: {
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      country: 'Mexico',
      address: 'Calle Principal 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      postCode: '01000',
      phone: '3025551234',
    },
    name: params.firstName,
    last_name: params.lastName,
    email_client: params.email,
    phone_number: '3025551234',
    currency: params.currency || 'MXN',
    cart: {
      total: params.amount,
      items,
    },
    items,
    metadata: {
      operation_date: new Date().toISOString(),
      customer_email: params.email,
      customer_id: params.customerId,
    },
    order_reference: orderReference,
    order_id: orderId,
    payment_id: paymentId,
    business_id: 21,
    payment_method: params.paymentMethod,
    return_url: TONDER_CONFIG.returnUrl,
    id_product: 'no_id',
    quantity_product: 1,
    id_ship: '0',
    instance_id_ship: '0',
    title_ship: 'shipping',
    description: 'transaction',
    device_session_id: null,
    token_id: '',
    source: 'sdk',
    browser_info: getBrowserInfo(),
    identification: {
      type: 'SSN',
      number: '123456789',
    },
    apm_config: {},
    amount: params.amount,
  }
}

const handlePaymentResponse = (response: TonderPaymentResponse) => {
  if (response.status === 500) {
    throw new Error(response.message || 'Error del proveedor. Intenta nuevamente.')
  }
  if (response.error) {
    throw new Error(response.error)
  }

  const redirectUrl =
    response.next_action?.redirect_to_url?.url ||
    response.checkout_url ||
    response.payment_url ||
    response.redirect_url

  if (redirectUrl) {
    window.open(redirectUrl, '_blank')
    return 'Redirigiendo a la página de pago...'
  }

  if (response.reference || response.payment_reference) {
    return `Referencia generada: ${response.reference ?? response.payment_reference}`
  }

  if (response.checkout_id) {
    return `Pago procesado. Checkout ID: ${response.checkout_id}`
  }

  return 'Pago procesado. Revisa la consola para más detalles.'
}

export const processTonderPayment = async (params: {
  amount: number
  fullName: string
  email: string
  customerId: string
  currency?: string
}) => {
  const checkout = await ensureLiteCheckout()
  const { firstName, lastName } = splitName(params.fullName)

  await checkout.configureCheckout({
    customer: {
      firstName,
      lastName,
      email: params.email,
    },
  })

  const payload = buildPaymentPayload({
    amount: params.amount,
    firstName,
    lastName,
    email: params.email,
    paymentMethod: "oxxopay",
    customerId: params.customerId,
    currency: params.currency || 'MXN',
  })
  try {
    await trackOxxoPayment({ customerId: params.customerId, payload })
  } catch (error) {
    console.warn('[TONDER] tracking failed', error)
  }
  const response = await checkout.payment(payload)
  return handlePaymentResponse(response)
}
