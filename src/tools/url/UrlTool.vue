<script setup>
import { computed, ref } from 'vue'
import { decodeUrl, encodeUrl, URL_MODES } from './url.js'

const input = ref('')
const output = ref('')
const mode = ref(URL_MODES.URI)
const errorMessage = ref('')

const modeLabel = computed(() => {
  if (mode.value === URL_MODES.URI) return 'encodeURI'
  if (mode.value === URL_MODES.COMPONENT) return 'encodeURIComponent'
  return '仅编码 URL 参数值'
})

function run(action) {
  errorMessage.value = ''

  try {
    output.value = action === 'encode' ? encodeUrl(input.value, mode.value) : decodeUrl(input.value, mode.value)
  } catch (error) {
    output.value = ''
    errorMessage.value = `无法${action === 'encode' ? '编码' : '解码'}：${error.message}`
  }
}
</script>

<template>
  <section class="tool-page url-tool" aria-labelledby="url-tool-title">
    <div class="tool-heading">
      <div>
        <p class="eyebrow">DEVELOPER TOOL</p>
        <h1 id="url-tool-title">URL 编解码</h1>
        <p>使用 UTF-8 在普通 URL 与 URL 参数之间转换文本。</p>
      </div>
    </div>

    <div class="workspace url-workspace">
      <section class="panel input-panel" aria-labelledby="url-input-title">
        <div class="panel-header">
          <div>
            <span class="panel-kicker">INPUT</span>
            <h2 id="url-input-title">输入内容</h2>
          </div>
          <span class="character-count">{{ input.length }} 字符</span>
        </div>
        <textarea
          v-model="input"
          aria-label="待编码或解码的 URL 内容"
          placeholder="在这里输入或粘贴 URL 内容…"
          spellcheck="false"
        />
      </section>

      <div class="url-actions" aria-label="URL 编解码操作">
        <label class="url-mode-label" for="url-mode">编码方式</label>
        <select id="url-mode" v-model="mode" aria-label="选择 URL 编码方式">
          <option :value="URL_MODES.URI">encodeURI</option>
          <option :value="URL_MODES.COMPONENT">encodeURIComponent</option>
          <option :value="URL_MODES.QUERY_VALUES">仅参数值</option>
        </select>
        <button type="button" class="url-action-button decode-action" @click="run('decode')">
          解码
        </button>
        <button type="button" class="url-action-button encode-action" @click="run('encode')">
          编码
        </button>
        <span class="url-mode-hint">当前：{{ modeLabel }}</span>
      </div>

      <section class="panel result-panel" aria-labelledby="url-output-title">
        <div class="panel-header">
          <div>
            <span class="panel-kicker">OUTPUT</span>
            <h2 id="url-output-title">结果</h2>
          </div>
        </div>
        <div class="result-content url-result-content">
          <div v-if="errorMessage" class="result-state error-state" role="alert">
            <span aria-hidden="true">!</span>
            <p>{{ errorMessage }}</p>
          </div>
          <div v-else-if="output" class="url-output" aria-live="polite">{{ output }}</div>
          <div v-else class="result-state empty-state">
            <span class="empty-icon" aria-hidden="true">↔</span>
            <p>编码或解码结果会显示在这里</p>
            <small>选择方式后点击中间的操作按钮</small>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
