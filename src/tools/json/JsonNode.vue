<script setup>
import { computed, ref } from 'vue'
import { formatJsonValue, isJsonContainer } from './json.js'

defineOptions({ name: 'JsonNode' })

const props = defineProps({
  value: {
    required: true,
  },
  propertyName: {
    type: String,
    default: null,
  },
  depth: {
    type: Number,
    default: 0,
  },
  isLast: {
    type: Boolean,
    default: true,
  },
  preserveEscapes: {
    type: Boolean,
    default: true,
  },
})

const collapsed = ref(false)
const container = computed(() => isJsonContainer(props.value))
const arrayValue = computed(() => Array.isArray(props.value))
const entries = computed(() => {
  if (!container.value) {
    return []
  }

  return arrayValue.value
    ? props.value.map((value, index) => ({ key: String(index), propertyName: null, value }))
    : Object.entries(props.value).map(([key, value]) => ({ key, propertyName: key, value }))
})
const openingBracket = computed(() => (arrayValue.value ? '[' : '{'))
const closingBracket = computed(() => (arrayValue.value ? ']' : '}'))
const propertyText = computed(() => {
  return props.propertyName === null
    ? ''
    : `${JSON.stringify(props.propertyName)}: `
})
const scalarText = computed(() => formatJsonValue(props.value, props.preserveEscapes))
const scalarClass = computed(() => {
  if (props.value === null) return 'json-null'
  if (typeof props.value === 'string') return 'json-string'
  if (typeof props.value === 'boolean') return 'json-boolean'
  return 'json-number'
})
const itemLabel = computed(() => `${entries.value.length} ${arrayValue.value ? '项' : '个键'}`)
const lineStyle = computed(() => ({ '--json-depth': props.depth }))
</script>

<template>
  <div class="json-node">
    <template v-if="container">
      <div class="json-line" :style="lineStyle">
        <span v-if="propertyText" class="json-key">{{ propertyText }}</span>
        <button
          class="collapse-button"
          type="button"
          :aria-expanded="!collapsed"
          :aria-label="collapsed ? `展开${itemLabel}` : `折叠${itemLabel}`"
          @click="collapsed = !collapsed"
        >
          <span class="collapse-icon" :class="{ collapsed }" aria-hidden="true">▼</span>
          <span class="json-bracket">{{ openingBracket }}</span>
        </button>
        <template v-if="collapsed">
          <span class="json-ellipsis"> … </span>
          <span class="json-bracket">{{ closingBracket }}</span>
          <span class="json-comment"> // {{ itemLabel }}</span>
          <span v-if="!isLast">,</span>
        </template>
      </div>

      <div v-show="!collapsed">
        <JsonNode
          v-for="(entry, index) in entries"
          :key="entry.key"
          :value="entry.value"
          :property-name="entry.propertyName"
          :depth="depth + 1"
          :is-last="index === entries.length - 1"
          :preserve-escapes="preserveEscapes"
        />
        <div class="json-line" :style="lineStyle">
          <span class="json-bracket">{{ closingBracket }}</span><span v-if="!isLast">,</span>
        </div>
      </div>
    </template>

    <div v-else class="json-line" :style="lineStyle">
      <span v-if="propertyText" class="json-key">{{ propertyText }}</span>
      <span :class="scalarClass">{{ scalarText }}</span><span v-if="!isLast">,</span>
    </div>
  </div>
</template>
