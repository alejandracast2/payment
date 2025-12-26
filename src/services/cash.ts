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
const trackCashPayment = async (params: { customerId: string; payload: CashPaymentPayload }) => {
  const body = {
    transactionId: params.customerId,
    event: 'payment cash',
    dataEvent: JSON.stringify(params.payload),
  }

  const { data } = await api.post('trackings/by-uuid', body)
  return data
}

type CashPaymentItem = {
  description: string
  quantity: number
  price_unit: number
  discount: number
  taxes: number
  product_reference: string
  name: string
  amount_total: number
}

type CashPaymentPayload = {
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
    items: CashPaymentItem[]
  }
  items: CashPaymentItem[]
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
  binary_mode: boolean
  apm_config: {
    country: string
    channel: string
    bank_ids: Array<{ id: string }>
  }
  [key: string]: unknown
}

type CashPaymentResponse = {
  status?: number
  message?: string
  error?: string
  checkout?: { redirect_url?: string }
  next_action?: { redirect_to_url?: { url?: string } | string }
  transaction_status?: string
  transaction_id?: string
  payment_id?: string
  checkout_id?: string
  id?: string
  redirect_url?: string
  checkout_url?: string
  [key: string]: unknown
}

type StoreSelection = {
  id: string
  name: string
  channel: string
}

type LiteInlineCheckout = {
  injectCheckout: () => Promise<void>
  payment: (payload: CashPaymentPayload) => Promise<CashPaymentResponse>
}

type LiteInlineCheckoutCtor = new (config: {
  mode: string
  apiKey: string
  returnUrl: string
  callBack?: (response: CashPaymentResponse) => void
}) => LiteInlineCheckout

const PAYMENT_SUCCESS_PATH = '/payment-success'
const TONDER_CONFIG = {
  mode: 'stage',
  apiKey: '1cccb499af3ad62bfb10a6efab1b07910b0bc39b',
  returnUrl: `${window.location.origin}/#${PAYMENT_SUCCESS_PATH}`,
  businessId: 21,
}

let liteCheckout: LiteInlineCheckout | null = null

const showResult = (message: string, isSuccess: boolean) => {
  const resultDiv = document.getElementById('result')
  if (resultDiv) {
    resultDiv.textContent = message
    resultDiv.className = `result ${isSuccess ? 'success' : 'error'}`
    resultDiv.style.display = 'block'

    setTimeout(() => {
      resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }
}

const report = (message: string, isSuccess: boolean) => {
  showResult(message, isSuccess)
  return message
}

const getBrowserInfo = (): BrowserInfo => ({
  javascript_enabled: true,
  time_zone: new Date().getTimezoneOffset(),
  language: navigator.language || 'es-MX',
  color_depth: window.screen?.colorDepth ?? 24,
  screen_width: window.screen?.width ?? 0,
  screen_height: window.screen?.height ?? 0,
  user_agent: navigator.userAgent,
})

const initializeSDK = async () => {
  try {
    console.log('Inicializando Tonder SDK...')
    const ctor = window.TonderSdk?.LiteInlineCheckout as unknown as LiteInlineCheckoutCtor | undefined
    if (!ctor) {
      throw new Error('Tonder SDK Lite no esta disponible. Carga el script CDN de TonderSdk antes de continuar.')
    }

    liteCheckout = new ctor({
      mode: TONDER_CONFIG.mode,
      apiKey: TONDER_CONFIG.apiKey,
      returnUrl: TONDER_CONFIG.returnUrl,
      callBack: (response: CashPaymentResponse) => {
        console.log('Callback response:', response)
        handlePaymentResponse(response)
      },
    })

    await liteCheckout?.injectCheckout()
    console.log('SDK inicializado correctamente')
  } catch (error) {
    console.error('Error al inicializar SDK:', error)
    showResult('Error al inicializar el sistema de pagos', false)
    throw error
  }
}

const handlePaymentResponse = (response: CashPaymentResponse) => {
  console.log('Procesando respuesta:', response)

  try {
    if (response.status === 500 || response.error) {
      const errorMsg = response.message || response.error || 'Error del servidor'
      return report(`Error: ${errorMsg}`, false)
    }

    if (response.checkout?.redirect_url) {
      const message = report('Codigo generado. Redirigiendo al voucher...', true)
      setTimeout(() => {
        window.location.href = response.checkout?.redirect_url || ''
      }, 1500)
      return message
    }

    const redirectToUrl = response.next_action?.redirect_to_url
    if (redirectToUrl) {
      const redirectUrl = typeof redirectToUrl === 'string' ? redirectToUrl : redirectToUrl.url
      if (redirectUrl) {
        const message = report('Codigo generado. Abriendo voucher de pago...', true)
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 1500)
        return message
      }
    }

    if (response.redirect_url) {
      const message = report('Codigo generado. Abriendo voucher...', true)
      setTimeout(() => {
        window.location.href = response.redirect_url || ''
      }, 1500)
      return message
    }

    if (response.checkout_url) {
      const message = report('Codigo generado. Redirigiendo...', true)
      setTimeout(() => {
        window.location.href = response.checkout_url || ''
      }, 1500)
      return message
    }

    if (response.transaction_status) {
      const status = response.transaction_status.toLowerCase()
      const id = response.transaction_id || response.id || 'N/A'

      if (status === 'success') {
        return report(`Codigo generado. ID: ${id}`, true)
      }
      if (status === 'pending') {
        return report(`Codigo pendiente. ID: ${id}`, true)
      }
      if (status === 'declined' || status === 'failed') {
        return report(`Error al generar codigo: ${response.message || 'Error desconocido'}`, false)
      }
      return report(`Estado: ${response.transaction_status}`, false)
    }

    if (response.payment_id || response.checkout_id || response.id) {
      const id = response.payment_id || response.checkout_id || response.id
      return report(`Codigo de pago generado. ID: ${id}`, true)
    }

    return report('Codigo de pago generado correctamente. Revisa la consola para mas detalles.', true)
  } catch (error) {
    console.error('Error al procesar respuesta:', error)
    return report('Error al interpretar la respuesta del servidor', false)
  }
}

const processPayment = async (params?: {
  amount?: number
  customerName?: string
  customerEmail?: string
  currency?: string
  customerId?: string
}) => {
  const payButton = document.getElementById('payButton') as HTMLButtonElement | null
  const loader = document.getElementById('loader')
  const resultDiv = document.getElementById('result')

  try {
    if (!liteCheckout) {
      await initializeSDK()
    }
    if (!liteCheckout) {
      throw new Error('SDK no inicializado correctamente')
    }

    const amountInput = document.getElementById('amount') as HTMLInputElement | null
    const nameInput = document.getElementById('customerName') as HTMLInputElement | null
    const emailInput = document.getElementById('customerEmail') as HTMLInputElement | null

    const amount =
      typeof params?.amount === 'number' && !Number.isNaN(params.amount)
        ? params.amount
        : parseFloat(amountInput?.value ?? '0')
    const customerName = params?.customerName?.trim() ?? nameInput?.value?.trim() ?? ''
    const customerEmail = params?.customerEmail?.trim() ?? emailInput?.value?.trim() ?? ''
    const currency = params?.currency || 'MXN'

    
    const bankId = '1020'
    const storeName = "BBVA Bancomer"
    const channel = 'WP'

    if (!bankId || !storeName) {
      return report('Por favor selecciona una tienda', false)
    }

    if (amount < 1) {
      return report('El monto minimo es de $1.00 MXN', false)
    }

    if (!customerName || !customerEmail) {
      return report('Por favor completa todos los campos', false)
    }

    if (payButton) {
      payButton.disabled = true
    }
    if (loader) {
      loader.classList.add('active')
    }
    if (resultDiv) {
      resultDiv.style.display = 'none'
    }

    console.log('Iniciando pago SafetyPay Cash...')
    console.log('Monto:', amount, currency)
    console.log('Tienda:', storeName)
    console.log('Bank ID:', bankId)
    console.log('Cliente:', customerName)

    const nameParts = customerName.trim().split(' ')
    const firstName = nameParts[0] || 'Nombre'
    const lastName = nameParts.slice(1).join(' ') || 'Apellido'

    const orderId = Math.floor(Date.now() / 1000)
    const paymentId = Math.floor(Math.random() * 90000) + 10000
    const orderReference = `CASH-${Math.random().toString(36).slice(2, 11).toUpperCase()}`

    const item: CashPaymentItem = {
      description: 'Pago en Efectivo via SafetyPay',
      quantity: 1,
      price_unit: amount,
      discount: 0,
      taxes: 0,
      product_reference: `cash-${Date.now()}`,
      name: `Pago en ${storeName}`,
      amount_total: amount,
    }

    const metadata: Record<string, string> = {
      operation_date: new Date().toISOString(),
      payment_method: 'safetypayCash',
      store_name: storeName,
      bank_id: bankId,
      channel,
      customer_email: customerEmail,
      business_user: 'finanzas_mexicana',
    }

    if (params?.customerId) {
      metadata.customer_id = params.customerId
    }

    const paymentData: CashPaymentPayload = {
      customer: {
        firstName,
        lastName,
        email: customerEmail,
        country: 'Mexico',
        address: 'Calle Principal 123',
        city: 'Ciudad de Mexico',
        state: 'CDMX',
        postCode: '01000',
        phone: '3025551234',
      },

      name: firstName,
      last_name: lastName,
      email_client: customerEmail,
      phone_number: '3025551234',

      currency,

      cart: {
        total: amount,
        items: [item],
      },

      items: [item],

      metadata,

      order_reference: orderReference,
      order_id: orderId,
      payment_id: paymentId,
      business_id: TONDER_CONFIG.businessId,

      payment_method: 'safetypayCash',
      return_url: TONDER_CONFIG.returnUrl,
      id_product: 'no_id',
      quantity_product: 1,
      id_ship: '0',
      instance_id_ship: '0',
      title_ship: 'shipping',
      description: 'SafetyPay Cash transaction',
      device_session_id: null,
      token_id: '',
      source: 'sdk',

      browser_info: getBrowserInfo(),

      binary_mode: true,

      apm_config: {
        country: 'Mexico',
        channel,
        bank_ids: [
          {
            id: bankId,
          },
        ],
      },
    }

    if (params?.customerId) {
      try {
        await trackCashPayment({ customerId: params.customerId, payload: paymentData })
      } catch (error) {
        console.warn('[CASH] tracking failed', error)
      }
    }
    console.log('Payload completo:', JSON.stringify(paymentData, null, 2))
    console.log('VERIFICACION:')
    console.log('  customer.email:', paymentData.customer.email)
    console.log('  cart.total:', paymentData.cart.total)
    console.log('  payment_method:', paymentData.payment_method)
    console.log('  apm_config:', paymentData.apm_config)

    console.log('Llamando a liteCheckout.payment()...')
    const response = await liteCheckout.payment(paymentData)

    console.log('Respuesta recibida:', response)
    console.log('Respuesta completa:', JSON.stringify(response, null, 2))

    if (!response.checkout && !response.next_action) {
      return handlePaymentResponse(response)
    }

    return 'Pago procesado. Revisa la consola para mas detalles.'
  } catch (error) {
    console.error('Error en el pago:', error)

    let errorMessage = 'Error al procesar el pago'
    if (error instanceof Error && error.message) {
      errorMessage += `: ${error.message}`
    }

    const rawMessage = error instanceof Error ? error.message : ''
    if (rawMessage.includes('500')) {
      errorMessage = 'Error del proveedor (500). Verifica la configuracion.'
    } else if (rawMessage.includes('401')) {
      errorMessage = 'Error de autenticacion (401). Verifica tu API Key.'
    } else if (rawMessage.includes('400')) {
      errorMessage = 'Datos invalidos (400). Revisa el payload en la consola.'
    }

    return report(errorMessage, false)
  } finally {
    if (payButton) {
      payButton.disabled = false
    }
    if (loader) {
      loader.classList.remove('active')
    }
  }
}

export const processCashPayment = async (params: {
  amount: number
  fullName: string
  email: string
  customerId: string
  currency?: string
}) => {
  await loadExternalScripts()
  return processPayment({
    amount: params.amount,
    customerName: params.fullName,
    customerEmail: params.email,
    currency: params.currency,
    customerId: params.customerId,
  })
}

console.log('SafetyPay Cash Script cargado')
console.log('Configuracion:', {
  mode: TONDER_CONFIG.mode,
  businessId: TONDER_CONFIG.businessId,
})
console.log('Tiendas disponibles: 20+ establecimientos')
console.log('Informacion del navegador:', getBrowserInfo())
