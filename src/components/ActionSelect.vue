<script setup lang="ts">
interface ActionOption {
  id: string
  title: string
  description: string
  accent: string
  icon: 'down' | 'up'
}

const props = defineProps<{
  actions: ActionOption[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const handleSelect = (id: string) => {
  emit('select', id)
}
</script>

<template>
  <div class="grid">
    <button
      v-for="action in props.actions"
      :key="action.id"
      type="button"
      class="action-card"
      :class="{ active: props.selectedId === action.id }"
      :style="{ boxShadow: `0 16px 36px ${action.accent}20, inset 0 1px 0 rgba(255, 255, 255, 0.08)` }"
      @click="handleSelect(action.id)"
    >
      <div class="icon" :class="action.icon" :style="{ color: action.accent }">
        <span v-if="action.icon === 'down'">↓</span>
        <span v-else>↑</span>
      </div>
      <div class="copy">
        <p class="title">{{ action.title }}</p>
        <p class="description">{{ action.description }}</p>
      </div>
    </button>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.action-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #232121;
  border: 1px solid rgba(240, 66, 66, 0.35);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease,
    filter 160ms ease;
  text-align: left;
  color: var(--text);
}

.action-card:hover {
  transform: translateY(-2px);
  border-color: rgba(240, 66, 66, 0.6);
  filter: brightness(1.04);
}

.action-card.active {
  border-color: rgba(240, 66, 66, 0.75);
  filter: brightness(1.06);
}

.icon {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 700;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title {
  margin: 0;
  font-weight: 700;
  font-size: 17px;
}

.description {
  margin: 0;
  color: var(--text-soft);
  font-size: 14px;
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .action-card {
    padding: 14px 16px;
    border-radius: 16px;
  }

  .icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    font-size: 22px;
  }

  .title {
    font-size: 16px;
  }

  .description {
    font-size: 13px;
  }
}
</style>
