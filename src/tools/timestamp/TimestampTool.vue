<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  beijingTimeToTimestamp,
  formatBeijingTime,
  timestampToBeijingTime,
  TIMESTAMP_UNITS,
} from './timestamp.js'

const now = ref(Date.now())
const timestampInput = ref('')
const timestampUnit = ref(TIMESTAMP_UNITS.SECONDS)
const timeInput = ref('')
const outputUnit = ref(TIMESTAMP_UNITS.SECONDS)
const copyStatuses = ref({})
const copyTimers = new Map()

let clockTimer

onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  window.clearInterval(clockTimer)
  copyTimers.forEach((timer) => window.clearTimeout(timer))
})

const currentBeijingTime = computed(() => formatBeijingTime(now.value))
const currentTimestamp = computed(() => Math.floor(now.value / 1000))

const timestampResult = computed(() => convert(timestampInput.value, () => {
  return timestampToBeijingTime(timestampInput.value, timestampUnit.value)
}))

const timeResult = computed(() => convert(timeInput.value, () => {
  return String(beijingTimeToTimestamp(timeInput.value, outputUnit.value))
}))

function convert(input, conversion) {
  if (!input.trim()) return { value: '', error: '' }

  try {
    return { value: conversion(), error: '' }
  } catch (error) {
    return { value: '', error: error.message }
  }
}

async function copyValue(value, key) {
  const text = String(value ?? '')
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    copyStatuses.value = { ...copyStatuses.value, [key]: '复制成功' }
  } catch {
    copyStatuses.value = { ...copyStatuses.value, [key]: '复制失败' }
  }

  window.clearTimeout(copyTimers.get(key))
  copyTimers.set(key, window.setTimeout(() => {
    copyStatuses.value = { ...copyStatuses.value, [key]: '' }
  }, 1800))
}
</script>

<template>
  <section class="tool-page timestamp-tool" aria-labelledby="timestamp-tool-title">
    <div class="tool-heading">
      <div>
        <p class="eyebrow">DEVELOPER TOOL</p>
        <h1 id="timestamp-tool-title">Unix 时间戳转换</h1>
        <p>所有时间均按北京时间（UTC+8）解析和显示。</p>
      </div>
    </div>

    <div class="timestamp-panel">
      <section class="timestamp-current" aria-label="当前北京时间和时间戳">
        <div>
          <span>当前北京时间</span>
          <div class="timestamp-value">
            <strong>{{ currentBeijingTime }}</strong>
            <button
              class="timestamp-copy-button"
              type="button"
              aria-label="复制当前北京时间"
              @click="copyValue(currentBeijingTime, 'currentTime')"
            >
              {{ copyStatuses.currentTime || '复制' }}
            </button>
          </div>
        </div>
        <div>
          <span>当前秒级时间戳</span>
          <div class="timestamp-value">
            <strong>{{ currentTimestamp }}</strong>
            <button
              class="timestamp-copy-button"
              type="button"
              aria-label="复制当前秒级时间戳"
              @click="copyValue(currentTimestamp, 'currentTimestamp')"
            >
              {{ copyStatuses.currentTimestamp || '复制' }}
            </button>
          </div>
        </div>
      </section>

      <section class="timestamp-row" aria-labelledby="timestamp-to-time-title">
        <div class="timestamp-field">
          <label id="timestamp-to-time-title" for="timestamp-input">时间戳转时间</label>
          <input
            id="timestamp-input"
            v-model="timestampInput"
            type="text"
            inputmode="numeric"
            placeholder="输入 Unix 时间戳"
            autocomplete="off"
          />
        </div>
        <select v-model="timestampUnit" aria-label="输入时间戳单位">
          <option :value="TIMESTAMP_UNITS.SECONDS">秒</option>
          <option :value="TIMESTAMP_UNITS.MILLISECONDS">毫秒</option>
        </select>
        <div class="timestamp-output">
          <output :class="{ 'timestamp-error': timestampResult.error }" aria-live="polite">
            {{ timestampResult.error || timestampResult.value || '等待输入' }}
          </output>
          <button
            class="timestamp-copy-button"
            type="button"
            :disabled="!timestampResult.value || Boolean(timestampResult.error)"
            aria-label="复制时间戳转换结果"
            @click="copyValue(timestampResult.value, 'timestampResult')"
          >
            {{ copyStatuses.timestampResult || '复制' }}
          </button>
        </div>
      </section>

      <section class="timestamp-row" aria-labelledby="time-to-timestamp-title">
        <div class="timestamp-field">
          <label id="time-to-timestamp-title" for="time-input">时间转 Unix 时间戳</label>
          <input
            id="time-input"
            v-model="timeInput"
            type="text"
            placeholder="时间格式：YYYY-MM-DD HH:mm:ss"
            autocomplete="off"
          />
        </div>
        <select v-model="outputUnit" aria-label="输出时间戳单位">
          <option :value="TIMESTAMP_UNITS.SECONDS">秒</option>
          <option :value="TIMESTAMP_UNITS.MILLISECONDS">毫秒</option>
        </select>
        <div class="timestamp-output">
          <output :class="{ 'timestamp-error': timeResult.error }" aria-live="polite">
            {{ timeResult.error || timeResult.value || '等待输入' }}
          </output>
          <button
            class="timestamp-copy-button"
            type="button"
            :disabled="!timeResult.value || Boolean(timeResult.error)"
            aria-label="复制时间转换结果"
            @click="copyValue(timeResult.value, 'timeResult')"
          >
            {{ copyStatuses.timeResult || '复制' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
