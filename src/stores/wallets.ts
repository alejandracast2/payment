// src/stores/wallets.ts
import { defineStore } from 'pinia'
import { api } from '@/api/axios'

export interface Wallet {
  id: number
  name: string
  // agrega los campos reales que devuelva tu API
}

interface WalletState {
  plataformId: number | null
  token: string
  wallets: Wallet[]
  loading: boolean
  error: string | null
  methods:Wallet[]
  user: Wallet | null
}

export const useWalletStore = defineStore('wallets', {
  state: (): WalletState => ({
    plataformId: null,
    token: '',
    wallets: [],
    loading: false,
    error: null,
    methods:[],
    user: null
  }),
  actions: {
    setAuth(plataformId: number, token: string) {
      this.plataformId = plataformId
      this.token = token
    },
    async fetchWallets() {
      if (this.plataformId === null || !this.token) {
        this.error = 'Falta plataformId o token'
        return
      }
      this.loading = true
      this.error = null
      try {
        const res = await api.post('wallets/by-plataform', {
          plataformId: this.plataformId,
          token: this.token,
        })
        this.wallets = res.data.data.wallets
        this.methods= res.data.data.wallets[0].paymetsMethods
        this.user =res.data.data.user
        console.log("ale",this.user)
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? err?.message ?? 'Error desconocido'
      } finally {
        this.loading = false
      }
    },
  },
})
