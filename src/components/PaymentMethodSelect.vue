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
    <label
      v-for="method in props.methods"
      :key="method.id"
      class="item"
      :class="{ active: props.selectedId === method.id }"
      :style="{ borderColor: props.selectedId === method.id ? `${method.accent ?? '#3B8EED'}40` : 'transparent' }"
    >
      <input
        type="radio"
        name="payment-method"
        :value="method.id"
        :checked="props.selectedId === method.id"
        @change="handleSelect(method.id)"
      />
      <div class="bullet" :style="{ borderColor: method.accent ?? '#3B8EED' }">
        <span :style="{ background: props.selectedId === method.id ? method.accent ?? '#3B8EED' : '#e5e7eb' }" />
      </div>
      <div class="info">
        <div class="row">
          <span class="name">{{ method.name }}</span>
          <!-- <span v-if="method.tag" class="tag" :style="{ background: `${method.accent ?? '#3B8EED'}12`, color: method.accent ?? '#3B8EED' }">
            {{ method.tag }}
          </span> -->
        </div>
        <!-- <p v-if="method.description" class="description">{{ method.description }}</p> -->
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
  background: rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  border: 1px solid transparent;
  box-shadow:
    0 10px 28px rgba(16, 24, 40, 0.08),
    0 2px 6px rgba(16, 24, 40, 0.08);
  cursor: pointer;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease;
}

.item:hover {
  transform: translateY(-1px);
  box-shadow:
    0 14px 32px rgba(16, 24, 40, 0.12),
    0 4px 8px rgba(16, 24, 40, 0.1);
}

.item.active {
  box-shadow:
    0 16px 36px rgba(63, 131, 248, 0.18),
    0 4px 12px rgba(63, 131, 248, 0.12);
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
  border: 2px solid #d1d5db;
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
  color: #0f172a;
}

.tag {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.description {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}
</style>
