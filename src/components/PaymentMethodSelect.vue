<script setup lang="ts">
interface PaymentMethod {
  id: number
  name: string
  description?: string
  tag?: string
  accent?: string
}

const props = defineProps<{
  methods: PaymentMethod[]
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
  <div class="list">
    <label v-for="method in props.methods" :key="method.id" class="item"
      :class="{ active: props.selectedId === method.id }"
      :style="{ borderColor: props.selectedId === method.id ? `${method.accent ?? '#b43131'}40` : 'transparent' }"
      @click="handleSelect(method.id)">
      <input type="radio" name="payment-method" :value="method.id" :checked="props.selectedId === method.id"
      />
      <div class="bullet" :style="{ borderColor: method.accent ?? '#b43131' }">
        <span
          :style="{ background: props.selectedId === method.id ? method.accent ?? '#b43131' : 'rgba(148, 163, 184, 0.45)' }" />
      </div>
      <div class="info">
        <div class="row">
          <span class="name">{{ method.name }}</span>

        </div>
      </div>
    </label>
  </div>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface-2);
  border-radius: 14px;
  border: 1px solid var(--border);
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.5),
    0 2px 6px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    filter 140ms ease;
}

.item:hover {
  transform: translateY(-1px);
  box-shadow:
    0 14px 32px rgba(0, 0, 0, 0.6),
    0 4px 8px rgba(0, 0, 0, 0.45);
  filter: brightness(1.03);
}

.item.active {
  box-shadow:
    0 16px 36px rgba(240, 66, 66, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.5);
}

input {
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}

.bullet {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(153, 79, 79, 0.45);
  display: grid;
  place-items: center;
  transition: border-color 140ms ease;
}

.bullet span {
  width: 10px;
  height: 10px;
  display: block;
  border-radius: 50%;
  transition: background 140ms ease;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  font-weight: 700;
  color: var(--text);
}

.tag {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.description {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 640px) {
  .list {
    gap: 8px;
  }

  .item {
    padding: 12px 14px;
    gap: 10px;
    border-radius: 12px;
  }

  .bullet {
    width: 20px;
    height: 20px;
  }

  .bullet span {
    width: 9px;
    height: 9px;
  }

  .name {
    font-size: 15px;
  }
}
</style>
