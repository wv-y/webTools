<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import JsonNode from './JsonNode.vue'
import { formatJson, parseJson } from './json.js'

const input = ref('')
const parsedValue = ref(null)
const hasResult = ref(false)
const errorMessage = ref('')
const preserveEscapes = ref(true)
const copyStatus = ref('')

let parseTimer
let copyTimer

function parseInput() {
  const text = input.value.trim()
  errorMessage.value = ''
  hasResult.value = false

  if (!text) {
    parsedValue.value = null
    return
  }

  try {
    parsedValue.value = parseJson(text)
    hasResult.value = true
  } catch (error) {
    parsedValue.value = null
    errorMessage.value = `JSON 格式错误：${error.message}`
  }
}

watch(input, () => {
  window.clearTimeout(parseTimer)
  parseTimer = window.setTimeout(parseInput, 200)
})

const copyText = computed(() => {
  return hasResult.value ? formatJson(parsedValue.value, preserveEscapes.value) : ''
})

async function copyResult() {
  try {
    await navigator.clipboard.writeText(copyText.value)
    copyStatus.value = '复制成功'
  } catch {
    copyStatus.value = '复制失败，请检查浏览器权限'
  }

  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copyStatus.value = ''
  }, 1800)
}

onUnmounted(() => {
  window.clearTimeout(parseTimer)
  window.clearTimeout(copyTimer)
})
</script>

<template>
  <section class="tool-page" aria-labelledby="json-tool-title">
    <div class="tool-heading">
      <div>
        <p class="eyebrow">DEVELOPER TOOL</p>
        <h1 id="json-tool-title">JSON 解析</h1>
        <p>实时格式化 JSON，逐层查看复杂数据结构。</p>
      </div>
      <div class="escape-setting" role="radiogroup" aria-label="字符串转义显示方式">
        <span>字符串转义</span>
        <label>
          <input v-model="preserveEscapes" type="radio" :value="true" />
          保留
        </label>
        <label>
          <input v-model="preserveEscapes" type="radio" :value="false" />
          还原
        </label>
      </div>
    </div>

    <div class="workspace">
      <section class="panel input-panel" aria-labelledby="json-input-title">
        <div class="panel-header">
          <div>
            <span class="panel-kicker">INPUT</span>
            <h2 id="json-input-title">原始 JSON</h2>
          </div>
          <span class="character-count">{{ input.length }} 字符</span>
        </div>
        <textarea
          v-model="input"
          aria-label="待解析的 JSON 字符串"
          placeholder="在这里粘贴 JSON 字符串…"
          spellcheck="false"
        />
      </section>

      <section class="panel result-panel" aria-labelledby="json-result-title">
        <div class="panel-header">
          <div>
            <span class="panel-kicker">OUTPUT</span>
            <h2 id="json-result-title">解析结果</h2>
          </div>
          <div class="copy-area">
            <span class="copy-status" role="status" aria-live="polite">{{ copyStatus }}</span>
            <button class="copy-button" type="button" :disabled="!hasResult" @click="copyResult">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                <rect x="3" y="8" width="13" height="13" rx="2" />
              </svg>
              复制
            </button>
          </div>
        </div>

        <div class="result-content">
          <div v-if="errorMessage" class="result-state error-state" role="alert">
            <span aria-hidden="true">!</span>
            <p>{{ errorMessage }}</p>
          </div>
          <JsonNode
            v-else-if="hasResult"
            :value="parsedValue"
            :preserve-escapes="preserveEscapes"
          />
          <div v-else class="result-state empty-state">
            <span class="empty-icon" aria-hidden="true">{ }</span>
            <p>解析结果会显示在这里</p>
            <small>输入有效 JSON 后自动解析</small>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

