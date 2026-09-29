<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  IMAGE_MODES,
  base64ToBytes,
  buildImageFileName,
  formatByteSize,
  isImageFile,
  parseBase64Image,
  readFileAsDataUrl,
} from './image.js'

const mode = ref(IMAGE_MODES.IMAGE_TO_BASE64)
const base64Input = ref('')
// 图片转 Base64 模式下由本地文件读出的图片：{ name, mimeType, base64, dataUrl, byteLength }
const loadedImage = ref(null)
const errorMessage = ref('')
const isDragging = ref(false)
const isLightboxOpen = ref(false)
const renderFailed = ref(false)
const copyStatus = ref('')
const fileInput = ref(null)

let copyTimer

const isDecoding = computed(() => mode.value === IMAGE_MODES.BASE64_TO_IMAGE)

// 右侧文本始终尝试解析：Base64 转图片模式下靠它实时生成左侧预览
const parsedInput = computed(() => {
  if (!base64Input.value.trim()) return { payload: null, error: '' }

  try {
    return { payload: parseBase64Image(base64Input.value), error: '' }
  } catch (error) {
    return { payload: null, error: error.message }
  }
})

const previewImage = computed(() => (isDecoding.value ? parsedInput.value.payload : loadedImage.value))
const previewError = computed(() => {
  if (isDecoding.value) return parsedInput.value.error
  return errorMessage.value
})
const previewMeta = computed(() => {
  const payload = previewImage.value
  if (!payload) return ''
  return `${payload.mimeType} · ${formatByteSize(payload.byteLength)}`
})
const hasContent = computed(() => Boolean(previewImage.value) || Boolean(base64Input.value))

// 换一张图片后重置渲染失败的标记
watch(() => previewImage.value?.dataUrl, () => {
  renderFailed.value = false
})

// 放大查看时禁止背景滚动
watch(isLightboxOpen, (opened) => {
  document.body.style.overflow = opened ? 'hidden' : ''
})

onMounted(() => {
  window.addEventListener('paste', onPaste)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('paste', onPaste)
  window.removeEventListener('keydown', onKeydown)
  window.clearTimeout(copyTimer)
  document.body.style.overflow = ''
})

function onKeydown(event) {
  if (event.key === 'Escape') closeLightbox()
}

function switchMode(nextMode) {
  if (nextMode === mode.value) return

  if (nextMode === IMAGE_MODES.IMAGE_TO_BASE64 && parsedInput.value.payload) {
    // 把右侧已解析成功的图片带到左侧，切换后仍可继续查看和放大
    loadedImage.value = { name: '', ...parsedInput.value.payload }
  }

  errorMessage.value = ''
  isLightboxOpen.value = false
  mode.value = nextMode
}

async function loadFile(file) {
  if (!file) return

  if (!isImageFile(file)) {
    errorMessage.value = '请选择图片文件'
    return
  }

  try {
    const dataUrl = await readFileAsDataUrl(file)
    loadedImage.value = { name: file.name, ...parseBase64Image(dataUrl) }
    base64Input.value = dataUrl
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message
  }
}

function openFileDialog() {
  fileInput.value?.click()
}

function onFileChange(event) {
  const [file] = event.target.files ?? []
  // 清空以便重复选择同一个文件时仍能触发 change
  event.target.value = ''
  loadFile(file)
}

function onDragOver() {
  isDragging.value = true
}

function onDrop(event) {
  isDragging.value = false
  loadFile((event.dataTransfer?.files ?? [])[0])
}

function onPaste(event) {
  const clipboard = event.clipboardData
  if (!clipboard) return

  const file = Array.from(clipboard.files ?? []).find(isImageFile)

  if (file) {
    event.preventDefault()
    loadFile(file)
    return
  }

  // 图片转 Base64 模式下允许直接粘贴 data URL 文本
  if (!isDecoding.value && /^data:image\//i.test(clipboard.getData('text').trim())) {
    event.preventDefault()
    mode.value = IMAGE_MODES.BASE64_TO_IMAGE
    base64Input.value = clipboard.getData('text').trim()
  }
}

function clearAll() {
  loadedImage.value = null
  base64Input.value = ''
  errorMessage.value = ''
  isLightboxOpen.value = false
}

async function copyBase64() {
  if (!base64Input.value) return

  try {
    await navigator.clipboard.writeText(base64Input.value)
    copyStatus.value = '复制成功'
  } catch {
    copyStatus.value = '复制失败'
  }

  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copyStatus.value = ''
  }, 1800)
}

function downloadImage() {
  const payload = previewImage.value
  if (!payload) return

  // 用 Blob URL 而不是直接给 data URL，避免大图片在部分浏览器里下载失败
  const objectUrl = URL.createObjectURL(new Blob([base64ToBytes(payload.base64)], { type: payload.mimeType }))
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = buildImageFileName(payload.name, payload.mimeType)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

function closeLightbox() {
  isLightboxOpen.value = false
}
</script>

<template>
  <section class="tool-page image-tool" aria-labelledby="image-tool-title">
    <div class="tool-heading">
      <div>
        <p class="eyebrow">DEVELOPER TOOL</p>
        <h1 id="image-tool-title">图片 Base64 互转</h1>
        <p>图片与 Base64 文本在本地浏览器内互转，内容不会上传到服务器。</p>
      </div>
      <div class="image-heading-actions">
        <div class="image-mode-switch" role="group" aria-label="转换方向">
          <button
            type="button"
            class="image-mode-button"
            :class="{ active: mode === IMAGE_MODES.IMAGE_TO_BASE64 }"
            :aria-pressed="mode === IMAGE_MODES.IMAGE_TO_BASE64"
            @click="switchMode(IMAGE_MODES.IMAGE_TO_BASE64)"
          >
            图片转 Base64
          </button>
          <button
            type="button"
            class="image-mode-button"
            :class="{ active: mode === IMAGE_MODES.BASE64_TO_IMAGE }"
            :aria-pressed="mode === IMAGE_MODES.BASE64_TO_IMAGE"
            @click="switchMode(IMAGE_MODES.BASE64_TO_IMAGE)"
          >
            Base64 转图片
          </button>
        </div>
        <span class="image-mode-hint">
          {{ isDecoding ? '在右侧粘贴 Base64，左侧实时显示图片' : '在左侧选择图片，右侧生成 Base64' }}
        </span>
      </div>
    </div>

    <div class="workspace image-workspace">
      <section class="panel image-panel" aria-labelledby="image-preview-title">
        <div class="panel-header">
          <div>
            <span class="panel-kicker">IMAGE</span>
            <h2 id="image-preview-title">图片预览</h2>
          </div>
          <div class="image-header-actions">
            <span v-if="previewImage" class="character-count image-meta">
              {{ previewImage.name ? `${previewImage.name} · ` : '' }}{{ previewMeta }}
            </span>
            <button
              type="button"
              class="image-action-button"
              :disabled="!hasContent"
              @click="clearAll"
            >
              清空
            </button>
            <button
              type="button"
              class="copy-button"
              :disabled="!previewImage"
              aria-label="下载图片"
              @click="downloadImage"
            >
              下载
            </button>
          </div>
        </div>

        <div
          class="image-preview"
          :class="{ 'is-dragging': isDragging }"
          @dragenter.prevent="onDragOver"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
          @click.self="!isDecoding && openFileDialog()"
        >
          <div v-if="previewError || renderFailed" class="result-state error-state" role="alert">
            <span aria-hidden="true">!</span>
            <p>{{ previewError || '图片内容无法渲染，请确认 Base64 数据完整' }}</p>
          </div>

          <template v-else-if="previewImage">
            <img
              class="image-preview-image"
              :src="previewImage.dataUrl"
              :alt="previewImage.name || '图片预览'"
              @click="isLightboxOpen = true"
              @error="renderFailed = true"
            />
            <p class="image-preview-tip">点击图片可放大查看</p>
          </template>

          <button v-else-if="!isDecoding" type="button" class="image-dropzone" @click="openFileDialog">
            <span class="empty-icon" aria-hidden="true">＋</span>
            <strong>点击选择图片</strong>
            <small>也可以把图片拖拽到这里，或直接粘贴（Ctrl / ⌘ + V）截图</small>
          </button>

          <div v-else class="result-state empty-state">
            <span class="empty-icon" aria-hidden="true">🖼</span>
            <p>等待 Base64 内容</p>
            <small>在右侧输入或粘贴 Base64（支持 data:image/... 前缀）</small>
          </div>
        </div>
      </section>

      <section class="panel input-panel image-input-panel" aria-labelledby="image-base64-title">
        <div class="panel-header">
          <div>
            <span class="panel-kicker">BASE64</span>
            <h2 id="image-base64-title">{{ isDecoding ? '输入 Base64' : '生成的 Base64' }}</h2>
          </div>
          <div class="image-header-actions">
            <span class="character-count">{{ base64Input.length }} 字符</span>
            <button
              type="button"
              class="image-action-button"
              :disabled="!base64Input"
              @click="clearAll"
            >
              清空
            </button>
            <span class="copy-status" aria-live="polite">{{ copyStatus }}</span>
            <button type="button" class="copy-button" :disabled="!base64Input" @click="copyBase64">
              复制
            </button>
          </div>
        </div>

        <textarea
          v-model="base64Input"
          :readonly="!isDecoding"
          :placeholder="
            isDecoding
              ? '在这里粘贴 Base64 文本，例如 data:image/png;base64,iVBORw0KGgo…'
              : '选择图片后自动生成 Base64 文本…'
          "
          :aria-label="isDecoding ? '待转换的 Base64 文本' : '图片生成的 Base64 文本'"
          spellcheck="false"
        />
      </section>
    </div>

    <input
      ref="fileInput"
      class="image-file-input"
      type="file"
      accept="image/*"
      aria-label="选择本地图片"
      @change="onFileChange"
    />

    <div
      v-if="isLightboxOpen && previewImage"
      class="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="放大查看图片"
      @click="closeLightbox"
    >
      <img
        class="image-lightbox-image"
        :src="previewImage.dataUrl"
        :alt="previewImage.name || '放大查看的图片'"
        @click.stop
      />
      <button type="button" class="image-lightbox-close" aria-label="关闭放大查看" @click="closeLightbox">
        关闭
      </button>
      <p class="image-lightbox-tip">点击空白处或按 Esc 关闭</p>
    </div>
  </section>
</template>
