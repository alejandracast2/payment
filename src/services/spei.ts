import type { TonderPaymentPayload, TonderPaymentResponse } from './tonder'

type BrowserInfo = {
  javascript_enabled: boolean
  time_zone: number
  language: string
  color_depth: number
  screen_width: number
  screen_height: number
  user_agent: string
}

type LiteInlineCheckout = {
  injectCheckout: () => Promise<void>
  configureCheckout: (config: { customer: { firstName: string; lastName: string; email: string } }) => Promise<void> | void
  payment: (payload: TonderPaymentPayload) => Promise<TonderPaymentResponse>
}

type LiteInlineCheckoutCtor = new (config: { mode: string; apiKey: string; returnUrl: string }) => LiteInlineCheckout

declare global {
  interface Window {
    TonderSdk?: {
      LiteInlineCheckout: LiteInlineCheckoutCtor
    }
  }
}
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


const TONDER_CONFIG = {
  mode: 'stage',
  apiKey: '1cccb499af3ad62bfb10a6efab1b07910b0bc39b',
  returnUrl: 'https://tonder.live/customer/sdklite-migallo/',
}

let liteCheckout: LiteInlineCheckout | null = null

const waitForTonderSDK = () =>
  new Promise<void>((resolve) => {
    const check = () => {
      if (window.TonderSdk?.LiteInlineCheckout) {
        resolve()
        return
      }
      setTimeout(check, 100)
    }
    check()
  })

const getBrowserInfo = (): BrowserInfo => ({
  javascript_enabled: true,
  time_zone: new Date().getTimezoneOffset(),
  language: navigator.language || 'es-MX',
  color_depth: window.screen?.colorDepth ?? 24,
  screen_width: window.screen?.width ?? 0,
  screen_height: window.screen?.height ?? 0,
  user_agent: navigator.userAgent,
})

const initializeSDK = async (): Promise<LiteInlineCheckout> => {
  // await waitForTonderSDK()
  await loadExternalScripts()
  // if (liteCheckout) return liteCheckout

  const ctor = window.TonderSdk?.LiteInlineCheckout
  if (!ctor) {
    throw new Error('Tonder SDK Lite no esta disponible. Carga el script de TonderSdk antes de continuar.')
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
  const firstName = parts[0] || 'Nombre'
  const lastName = parts.slice(1).join(' ') || 'Apellido'
  return { firstName, lastName }
}

const buildPaymentData = (params: {
  firstName: string
  lastName: string
  email: string
  amount: number
  customerId: string
  currency: string
}): TonderPaymentPayload => {
  const item = {
    description: 'Product',
    quantity: 1,
    price_unit: params.amount,
    discount: 0,
    taxes: 0,
    product_reference: 'PROD001',
    name: 'Tonder Product',
    amount_total: params.amount,
  }

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
      city: 'Ciudad de Mexico',
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
      items: [item],
    },
    items: [item],
    metadata: {
      operation_date: new Date().toISOString(),
      customer_email: params.email,
      business_user: 'tonder_user',
      customer_id: params.customerId,
    },
    order_reference: orderReference,
    order_id: orderId,
    payment_id: paymentId,
    business_id: 21,
    payment_method: 'Spei',
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
    throw new Error(response.message || 'Error del proveedor.')
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
    window.location.href = redirectUrl
    return 'Redirigiendo a la pagina de SPEI...'
  }

  if (response.checkout_id) {
    return `Pago procesado. Checkout ID: ${response.checkout_id}`
  }

  return 'Pago procesado. Revisa la consola para mas detalles.'
}

export const processSpeiPayment = async (params: {
  amount: number
  fullName: string
  email: string
  customerId: string
  currency?: string
}) => {
  console.log('[SPEI] Iniciando flujo SPEI', params)
  const checkout = await initializeSDK()
  const { firstName, lastName } = splitName(params.fullName)

  await checkout.configureCheckout({
    customer: {
      firstName,
      lastName,
      email: params.email,
    },
  })

  const payload = buildPaymentData({
    firstName,
    lastName,
    email: params.email,
    amount: params.amount,
    customerId: params.customerId,
    currency: params.currency || 'MXN',
  })

  console.log('[SPEI] Payload preparado', payload)
  const response = await checkout.payment(payload)
  console.log('[SPEI] Respuesta recibida', response)
  return handlePaymentResponse(response)
}
