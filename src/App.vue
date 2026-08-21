<script setup>
import { ref } from 'vue'
import JsonTool from './tools/json/JsonTool.vue'
import UrlTool from './tools/url/UrlTool.vue'

const currentTool = ref(window.location.hash === '#/url' ? 'url' : 'json')

window.addEventListener('hashchange', () => {
  currentTool.value = window.location.hash === '#/url' ? 'url' : 'json'
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" :href="`#/${currentTool}`" target="_blank" rel="noopener noreferrer">
        <span class="brand-mark" aria-hidden="true">{ }</span>
        Web Tools
      </a>
      <nav class="navigation" aria-label="工具导航">
        <a class="navigation-link" :class="{ active: currentTool === 'json' }" href="#/json" target="_blank" rel="noopener noreferrer">
          JSON 解析
        </a>
        <a class="navigation-link" :class="{ active: currentTool === 'url' }" href="#/url" target="_blank" rel="noopener noreferrer">
          URL 编解码
        </a>
      </nav>
    </header>

    <main class="main-content">
      <UrlTool v-if="currentTool === 'url'" />
      <JsonTool v-else />
    </main>
  </div>
</template>
