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
        :style="{ background: 'var(--badge-gradient)' }"
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
  border: 1px solid rgba(240, 66, 66, 0.35);
  border-radius: 16px;
  background: #232121;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.55),
    0 2px 6px rgba(0, 0, 0, 0.4);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease,
    filter 160ms ease;
  text-align: left;
  color: var(--text);
}

.wallet-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.6),
    0 4px 10px rgba(0, 0, 0, 0.45);
  filter: brightness(1.04);
}

.wallet-card.active {
  border-color: rgba(240, 66, 66, 0.7);
  box-shadow: var(--button-shadow);
}

.badge {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
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
  color: var(--text-muted);
  font-size: 13px;
}

.chevron {
  font-size: 18px;
  color: var(--text-muted);
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
