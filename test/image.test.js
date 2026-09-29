import assert from 'node:assert/strict'
import test from 'node:test'
import {
  base64ToBytes,
  buildDataUrl,
  buildImageFileName,
  detectImageMimeType,
  formatByteSize,
  imageFileExtension,
  isImageFile,
  parseBase64Image,
} from '../src/tools/image/image.js'

const toBase64 = (bytes) => Buffer.from(bytes).toString('base64')

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0]
const GIF_HEADER = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
const WEBP_HEADER = [0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]
// 11 字节的 PNG，Base64 中带 “+” 和结尾填充，用于验证空格与换行的容错
const PNG_BASE64 = toBase64([...PNG_HEADER, 0xff, 0xfb, 0xff])
const PNG_BYTE_LENGTH = 11

test('解析带 MIME 声明的 data URL', () => {
  const base64 = toBase64([...PNG_HEADER, 0x01, 0x02, 0x03, 0x04])
  const payload = parseBase64Image(`data:image/png;base64,${base64}`)

  assert.equal(payload.mimeType, 'image/png')
  assert.equal(payload.base64, base64)
  assert.equal(payload.byteLength, 12)
  assert.equal(payload.dataUrl, buildDataUrl(base64, 'image/png'))
})

test('声明了 MIME 类型时优先使用声明值', () => {
  const payload = parseBase64Image(`data:image/jpeg;base64,${toBase64(PNG_HEADER)}`)

  assert.equal(payload.mimeType, 'image/jpeg')
})

test('纯 Base64 通过魔数识别图片类型', () => {
  assert.equal(parseBase64Image(toBase64(PNG_HEADER)).mimeType, 'image/png')
  assert.equal(parseBase64Image(toBase64(JPEG_HEADER)).mimeType, 'image/jpeg')
  assert.equal(parseBase64Image(toBase64(GIF_HEADER)).mimeType, 'image/gif')
  assert.equal(parseBase64Image(toBase64(WEBP_HEADER)).mimeType, 'image/webp')
})

test('容忍换行、空格（Base64 中的 + 被转义成空格）', () => {
  assert.equal(PNG_BASE64.includes('+'), true, 'fixture 需要包含 “+” 才能覆盖该场景')

  const payload = parseBase64Image(`data:image/png;base64,\n${PNG_BASE64.slice(0, 8)}\r\n${PNG_BASE64.slice(8)}`)

  assert.equal(payload.base64, PNG_BASE64)
  assert.equal(payload.byteLength, PNG_BYTE_LENGTH)

  const spaced = parseBase64Image(PNG_BASE64.replace('+', ' '))

  assert.equal(spaced.base64, PNG_BASE64)
  assert.equal(spaced.mimeType, 'image/png')
})

test('兼容省略 data: 前缀的 image/png;base64, 写法', () => {
  const payload = parseBase64Image(`image/png;base64,${PNG_BASE64}`)

  assert.equal(payload.base64, PNG_BASE64)
  assert.equal(payload.mimeType, 'image/png')
})

test('支持未声明 base64 的内联 SVG', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><text>图片</text></svg>'
  const payload = parseBase64Image(`data:image/svg+xml,${svg}`)
  const decoded = Buffer.from(payload.base64, 'base64')

  assert.equal(payload.mimeType, 'image/svg+xml')
  assert.equal(payload.byteLength, Buffer.byteLength(svg, 'utf8'))
  assert.equal(decoded.toString('utf8'), svg)

  const encoded = parseBase64Image('data:image/svg+xml,%3Csvg%3E%3C/svg%3E')

  assert.equal(Buffer.from(encoded.base64, 'base64').toString('utf8'), '<svg></svg>')

  // SVG 里出现未转义的 “%”（如 width="100%"）时按原文处理，不报错
  const percent = parseBase64Image('data:image/svg+xml,<svg width="100%"></svg>')

  assert.equal(Buffer.from(percent.base64, 'base64').toString('utf8'), '<svg width="100%"></svg>')
})

test('非图片内容会抛出明确的错误', () => {
  assert.throws(() => parseBase64Image(toBase64(Buffer.from('hello world'))), /无法识别的图片格式/)
})

test('非法 Base64 内容会抛出错误', () => {
  assert.throws(() => parseBase64Image('这不是 base64!!!'), /Base64 内容格式不正确/)
  assert.throws(() => parseBase64Image('AAAAA'), /Base64 内容格式不正确/)
  assert.throws(() => parseBase64Image('   '), /请输入 Base64 内容/)
})

test('detectImageMimeType 对未知内容返回空字符串', () => {
  assert.equal(detectImageMimeType(''), '')
  assert.equal(detectImageMimeType('hello'), '')
})

test('formatByteSize 按 1024 进制格式化', () => {
  assert.equal(formatByteSize(512), '512 B')
  assert.equal(formatByteSize(1024), '1.0 KB')
  assert.equal(formatByteSize(1536), '1.5 KB')
  assert.equal(formatByteSize(1024 * 1024 * 3), '3.0 MB')
  assert.equal(formatByteSize(-1), '')
})

test('imageFileExtension 按 MIME 类型给出后缀，未知类型回退 .png', () => {
  assert.equal(imageFileExtension('image/jpeg'), '.jpg')
  assert.equal(imageFileExtension('IMAGE/SVG+XML'), '.svg')
  assert.equal(imageFileExtension('image/heic'), '.png')
  assert.equal(imageFileExtension(undefined), '.png')
})

test('buildImageFileName 保留原文件名但后缀跟随实际类型', () => {
  assert.equal(buildImageFileName('photo.jpeg', 'image/png'), 'photo.png')
  assert.equal(buildImageFileName('photo', 'image/jpeg'), 'photo.jpg')
  assert.equal(buildImageFileName('我的 截图.tar.gz', 'image/webp'), '我的 截图.tar.webp')
  assert.equal(buildImageFileName('', 'image/gif'), 'image.gif')
  assert.equal(buildImageFileName(undefined, 'image/svg+xml'), 'image.svg')
})

test('base64ToBytes 还原原始字节', () => {
  const bytes = [...PNG_HEADER, 0x00, 0xff, 0x7f]

  assert.deepEqual(Array.from(base64ToBytes(toBase64(bytes))), bytes)
})

test('isImageFile 优先按 MIME 类型判断，缺失时回退扩展名', () => {
  assert.equal(isImageFile({ type: 'image/webp', name: 'a.webp' }), true)
  assert.equal(isImageFile({ type: 'text/plain', name: 'a.png' }), false)
  assert.equal(isImageFile({ type: '', name: 'a.PNG' }), true)
  assert.equal(isImageFile({ type: '', name: 'a.txt' }), false)
  assert.equal(isImageFile(null), false)
})
