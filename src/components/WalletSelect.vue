<script setup lang="ts">
interface WalletOption {
  id: number
  name: string
}

const props = defineProps<{
  wallets: WalletOption[]
  selectedId: number | null
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

const handleSelect = (id: number) => {
  emit('select', id)
}
</script>

<template>
  <div class="grid">
    <button
      v-for="wallet in props.wallets"
      :key="wallet.id"
      type="button"
      class="wallet-card"
      :class="{ active: props.selectedId === wallet.id }"
      @click="handleSelect(wallet.id)"
    >
      <div
        class="badge"
        :style="{ background:'linear-gradient(135deg, #d9e8ff, #bcd1ff)' }"
      >
        <span>{{ wallet.name?.[0]?.toUpperCase() ?? '?' }}</span>
      </div>
      <div class="content">
        <p class="title">{{ wallet.name }}</p>
        <!-- <p class="subtitle">{{ wallet.subtitle }}</p> -->
      </div>
      <div class="chevron">›</div>
    </button>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.wallet-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow:
    0 12px 32px rgba(16, 24, 40, 0.08),
    0 2px 6px rgba(16, 24, 40, 0.08);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease;
  text-align: left;
  color: #0f172a;
}

.wallet-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 16px 38px rgba(16, 24, 40, 0.14),
    0 4px 10px rgba(16, 24, 40, 0.1);
}

.wallet-card.active {
  border-color: rgba(63, 131, 248, 0.35);
  box-shadow:
    0 16px 40px rgba(63, 131, 248, 0.18),
    0 4px 12px rgba(63, 131, 248, 0.12);
}

.badge {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #0b1021;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.badge span {
  font-size: 18px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  margin: 0;
  font-weight: 700;
  font-size: 16px;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.chevron {
  font-size: 18px;
  color: #cbd5e1;
  font-weight: 700;
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .wallet-card {
    padding: 12px 14px;
    border-radius: 14px;
  }

  .badge {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }

  .badge span {
    font-size: 16px;
  }

  .title {
    font-size: 15px;
  }

  .chevron {
    font-size: 16px;
  }
}
</style>
