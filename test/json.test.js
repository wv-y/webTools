import assert from 'node:assert/strict'
import test from 'node:test'
import { formatJson, parseJson } from '../src/tools/json/json.js'

test('格式化嵌套 JSON 和各种基础类型', () => {
  const value = parseJson('{"name":"万物","active":true,"empty":null,"items":[1,{},[]]}')

  assert.equal(
    formatJson(value),
    '{\n  "name": "万物",\n  "active": true,\n  "empty": null,\n  "items": [\n    1,\n    {},\n    []\n  ]\n}',
  )
})

test('保留超大整数、小数和指数数字的原始精度', () => {
  const source = '{"id":9223372036854775807,"rate":0.1234567890123456789,"size":1.25e+30}'
  const formatted = formatJson(parseJson(source))

  assert.match(formatted, /9223372036854775807/)
  assert.match(formatted, /0\.1234567890123456789/)
  assert.match(formatted, /1\.25e\+30/)
})

test('转义模式同时决定展示与复制文本', () => {
  const value = parseJson('{"text":"第一行\\n第二行\\t\\\"引号\\\"\\\\路径"}')
  const escaped = formatJson(value, true)
  const restored = formatJson(value, false)

  assert.ok(escaped.includes('第一行\\n第二行\\t\\"引号\\"\\\\路径'))
  assert.ok(restored.includes('第一行\n第二行\t"引号"\\路径'))
  assert.notEqual(escaped, restored)
})

test('关闭字符串转义时对象键仍保持合法转义', () => {
  const formatted = formatJson(parseJson('{"line\\nkey":"value"}'), false)

  assert.ok(formatted.includes('"line\\nkey": "value"'))
})

test('拒绝无效 JSON', () => {
  assert.throws(() => parseJson('{"missing":}'))
})
