import { defineStore } from 'pinia'
// import axios from 'axios'
import { api } from '@/api/axios'

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    loading: false,
    error: null as string | null,
    lastTransaction: null as any
  }),

  actions: {
    async createTransaction(payload: {
      clientId: number,
      walletId: number,
      amount: number,
      type: string,
      token: string,
      coin: string
    }) {
      this.loading = true
      this.error = null

      try {
        const domain = localStorage.getItem("domain") // o usa tu getter si lo tienes
        const url = `${domain}/transactions`
        const res = await api.post('transactions',payload)
        // const res = await axios.post(url, payload)

        this.lastTransaction = res.data
        return res.data

      } catch (err: any) {
        this.error = err?.response?.data?.message || "Error creando transacción"
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
