<script setup>
import JsonTool from './tools/json/JsonTool.vue'
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#/json" target="_blank" rel="noopener noreferrer">
        <span class="brand-mark" aria-hidden="true">{ }</span>
        Web Tools
      </a>
      <nav class="navigation" aria-label="工具导航">
        <a class="navigation-link active" href="#/json" target="_blank" rel="noopener noreferrer">
          JSON 解析
        </a>
      </nav>
    </header>

    <main class="main-content">
      <JsonTool />
    </main>
  </div>
</template>

