/**
 * 图片与 Base64 互转的纯函数工具集。
 * 只依赖浏览器和 Node 都内置的 atob/btoa/TextEncoder，便于直接在 Node 中跑单元测试。
 */

export const IMAGE_MODES = {
  IMAGE_TO_BASE64: 'imageToBase64',
  BASE64_TO_IMAGE: 'base64ToImage',
}

const DATA_URL_PATTERN = /^data:([^,]*),([\s\S]*)$/i
// 省略 data: 前缀的写法，如 image/png;base64,iVBORw0KGgo...
const MIME_PREFIX_PATTERN = /^[\w.+-]+\/[\w.+-]+;base64,/i
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/
const IMAGE_MIME_PATTERN = /^image\//i
const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg|ico|avif|tiff?)$/i
// 内联 SVG 是文本内容，通过文本特征而不是魔数判断
const INLINE_SVG_PATTERN = /^\s*(<svg[\s>]|<\?xml[\s\S]*?<svg[\s>])/i

// 常见图片格式的魔数特征，用于没有 MIME 声明时推断类型
const IMAGE_SIGNATURES = [
  { mimeType: 'image/png', offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: 'image/jpeg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { mimeType: 'image/gif', offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
  { mimeType: 'image/bmp', offset: 0, bytes: [0x42, 0x4d] },
  { mimeType: 'image/tiff', offset: 0, bytes: [0x49, 0x49, 0x2a, 0x00] },
  { mimeType: 'image/x-icon', offset: 0, bytes: [0x00, 0x00, 0x01, 0x00] },
  { mimeType: 'image/webp', offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  { mimeType: 'image/avif', offset: 8, bytes: [0x61, 0x76, 0x69, 0x66] },
]

/**
 * 解析 Base64 文本并返回图片信息。
 * 支持 data URL、纯 Base64、省略 data: 前缀的写法以及内联 SVG。
 *
 * @param {string} value 待解析的文本
 * @returns {{mimeType: string, base64: string, dataUrl: string, byteLength: number}}
 */
export function parseBase64Image(value) {
  const raw = String(value ?? '').trim()

  if (!raw) throw new Error('请输入 Base64 内容')

  const normalized = MIME_PREFIX_PATTERN.test(raw) ? `data:${raw}` : raw
  const dataUrlMatch = DATA_URL_PATTERN.exec(normalized)

  if (!dataUrlMatch) {
    return createImagePayload(normalizeBase64(raw), '')
  }

  const [, meta = '', payload = ''] = dataUrlMatch
  const segments = meta.split(';')
  const declaredMimeType = segments[0].trim()
  const isBase64Encoded = segments
    .slice(1)
    .some((segment) => segment.trim().toLowerCase() === 'base64')

  if (!isBase64Encoded) {
    // 兼容 data:image/svg+xml,%3Csvg%3E... 这类未声明 base64 的内联写法
    return createImagePayload(encodeUtf8ToBase64(decodeDataUrlText(payload)), declaredMimeType)
  }

  return createImagePayload(normalizeBase64(payload), declaredMimeType)
}

/**
 * 推断图片的 MIME 类型，无法识别时返回空字符串。
 *
 * @param {string} binary atob 解码出来的二进制字符串（每个字符一字节）
 * @returns {string}
 */
export function detectImageMimeType(binary) {
  if (!binary) return ''
  if (INLINE_SVG_PATTERN.test(binary)) return 'image/svg+xml'

  const matched = IMAGE_SIGNATURES.find(({ offset, bytes }) => {
    return bytes.every((byte, index) => binary.charCodeAt(offset + index) === byte)
  })

  return matched ? matched.mimeType : ''
}

/** 拼接 data URL */
export function buildDataUrl(base64, mimeType) {
  return `data:${mimeType};base64,${base64}`
}

// 下载时按 MIME 类型给出合适的文件后缀
const MIME_EXTENSIONS = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/avif': '.avif',
  'image/tiff': '.tiff',
}

/** 根据 MIME 类型返回文件后缀，未知类型回退到 .png */
export function imageFileExtension(mimeType) {
  return MIME_EXTENSIONS[String(mimeType ?? '').toLowerCase()] ?? '.png'
}

/**
 * 生成下载文件名：保留原文件名，但后缀跟随实际图片类型；没有原文件名时用默认名。
 *
 * @param {string} name 原始文件名，可为空
 * @param {string} mimeType 图片 MIME 类型
 * @returns {string}
 */
export function buildImageFileName(name, mimeType) {
  const extension = imageFileExtension(mimeType)
  const baseName = String(name ?? '').replace(/\.[^./\\]+$/, '').trim()

  return baseName ? `${baseName}${extension}` : `image${extension}`
}

/** 把 Base64 解码成字节数组，下载时用于构造 Blob */
export function base64ToBytes(base64) {
  const binary = decodeBase64(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

/** 按 1024 进制格式化字节数 */
export function formatByteSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''

  const units = ['KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = -1

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  if (unitIndex === -1) return `${bytes} B`

  return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[unitIndex]}`
}

/** 判断文件是否是图片，优先看 MIME 类型，缺失时回退到扩展名 */
export function isImageFile(file) {
  if (!file) return false

  return file.type
    ? IMAGE_MIME_PATTERN.test(file.type)
    : IMAGE_EXTENSION_PATTERN.test(file.name ?? '')
}

/** 读取本地图片文件为 data URL */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取图片文件失败'))
    reader.readAsDataURL(file)
  })
}

function createImagePayload(base64, declaredMimeType) {
  if (!BASE64_PATTERN.test(base64) || base64.length % 4 !== 0) {
    throw new Error('Base64 内容格式不正确')
  }

  // 只解码开头一小段用于识别魔数，避免大图片被整体解码
  const mimeType = IMAGE_MIME_PATTERN.test(declaredMimeType)
    ? declaredMimeType
    : detectImageMimeType(decodeBase64(base64.slice(0, 32)))

  if (!mimeType) {
    throw new Error('无法识别的图片格式，请确认内容是图片的 Base64')
  }

  return {
    mimeType,
    base64,
    dataUrl: buildDataUrl(base64, mimeType),
    byteLength: computeByteLength(base64),
  }
}

/** Base64 里不应出现空白；空格通常来自表单把 “+” 转义成了空格 */
function normalizeBase64(value) {
  return value.replace(/[ \t]+/g, '+').replace(/[\r\n]+/g, '')
}

/** 由 Base64 长度直接推算原始字节数，无需解码 */
function computeByteLength(base64) {
  const paddingLength = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0

  return (base64.length / 4) * 3 - paddingLength
}

/** 未声明 base64 的 data URL 用百分号编码承载文本，个别非法转义（如 SVG 里的 “%”）按原文处理 */
function decodeDataUrlText(payload) {
  const text = payload.trim()

  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

function decodeBase64(base64) {
  try {
    return atob(base64)
  } catch {
    throw new Error('Base64 内容格式不正确')
  }
}

function encodeUtf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}
