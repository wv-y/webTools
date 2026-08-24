<script setup>
import { ref } from 'vue'
import JsonTool from './tools/json/JsonTool.vue'
import TimestampTool from './tools/timestamp/TimestampTool.vue'
import UrlTool from './tools/url/UrlTool.vue'

const tools = ['json', 'url', 'timestamp']
const getCurrentTool = () => {
  const tool = window.location.hash.replace('#/', '')
  return tools.includes(tool) ? tool : 'json'
}
const currentTool = ref(getCurrentTool())

window.addEventListener('hashchange', () => {
  currentTool.value = getCurrentTool()
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" :href="`#/${currentTool}`">
        <span class="brand-mark" aria-hidden="true">{ }</span>
        Web Tools
      </a>
      <nav class="navigation" aria-label="工具导航">
        <a class="navigation-link" :class="{ active: currentTool === 'json' }" href="#/json">
          JSON 解析
        </a>
        <a class="navigation-link" :class="{ active: currentTool === 'url' }" href="#/url">
          URL 编解码
        </a>
        <a class="navigation-link" :class="{ active: currentTool === 'timestamp' }" href="#/timestamp">
          时间戳转换
        </a>
      </nav>
    </header>

    <main class="main-content">
      <UrlTool v-if="currentTool === 'url'" />
      <TimestampTool v-else-if="currentTool === 'timestamp'" />
      <JsonTool v-else />
    </main>
  </div>
</template>
